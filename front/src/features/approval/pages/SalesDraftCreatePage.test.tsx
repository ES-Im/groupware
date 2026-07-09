import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { SalesDraftCreatePage } from './SalesDraftCreatePage'

/**
 * SalesDraftCreatePage(F760 `SALES_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(SALES) T2.3) 회귀 방지
 * 테스트. ③BusinessTripDraftCreatePage(F730)/④LeaveDraftCreatePage(F740)의 폼 로직을 동형
 * 이식한 페이지라 검증 축도 동형이다:
 *   - zod 사전검증(빈 값 제출 시 인라인 에러, 두 버튼 모두 동일 검증) — API 미호출.
 *   - FranchisePicker에서 가맹점을 선택하면 franchiseId가 setValue로 동기화되어 검증을 통과한다.
 *   - [생성 후 상신] 결재선 0명 클라 가드(root 에러) — API 미호출. 임시저장은 차단하지 않는다.
 *   - 정상 입력 + 결재선 1명 지정 후 [임시저장으로 생성] 성공 시 상세로 navigate + 성공 토스트.
 *
 * FranchisePicker(useMeQuery/useFranchisesQuery)와 EmployeePicker(department 도메인
 * useDepartmentsQuery/useDepartmentMembersQuery)가 이 페이지 마운트 순간 함께 동작하므로,
 * GET /api/employees/me, /api/franchises, /api/departments 목이 모든 테스트 케이스에 필요하다
 * (onUnhandledRequest:'error').
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function pageOf<T>(items: T[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: {
      deptId,
      deptCode: String(deptId).padStart(3, '0'),
      deptName,
      isActive: true,
      parentDeptId: null,
    },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function meFixture(empId: number) {
  return {
    empBasicInfo: {
      empId,
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

function franchise(id: number, name: string, managerEmpId: number) {
  return {
    id,
    name,
    address: '서울특별시 강남구',
    ownerName: '홍길동',
    BusinessStatus: '정상 영업 중',
    managerEmpId,
    managerEmpName: '김담당',
  }
}

/**
 * FranchisePicker(useMeQuery + useFranchisesQuery)와 EmployeePicker(department 도메인)가 이
 * 페이지 마운트 즉시 함께 조회하는 4종 목을 한 번에 등록한다.
 */
function mockPickers() {
  server.use(
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(7))),
    http.get(`${BASE_URL}/api/franchises`, () =>
      HttpResponse.json(pageOf([franchise(1, '테스트강남점', 7)])),
    ),
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([deptSummary(1, '개발팀')]))),
    http.get(`${BASE_URL}/api/departments/1/members`, () =>
      HttpResponse.json(
        pageOf([
          { empId: 101, empNo: 'E101', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '사원' },
        ]),
      ),
    ),
  )
}

function DetailPlaceholder() {
  const { draftId } = useParams()
  return <div>기안 상세 화면 draftId={draftId}</div>
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/approval/drafts/sales/new']}>
        <Routes>
          <Route path="/approval/drafts/sales/new" element={<SalesDraftCreatePage />} />
          <Route path="/approval/drafts/:draftId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillValidFormWithoutFranchise(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^제목/), '7월 매출 보고')
  await user.type(screen.getByLabelText(/^본문/), '7월 매출 실적을 보고합니다')
  fireEvent.change(screen.getByLabelText(/매출 보고월/), { target: { value: '2026-07' } })
  fireEvent.change(screen.getByLabelText(/매출액/), { target: { value: '10000000' } })
}

async function selectFranchise(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /테스트강남점/ }))
}

async function selectOneApprover(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '개발팀' }))
  await user.click(await screen.findByRole('button', { name: /김철수/ }))
}

describe('SalesDraftCreatePage (F760) - zod 사전검증(빈 값)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값으로 "생성 후 상신"을 눌러도 필드 인라인 에러를 보여주고 API를 호출하지 않는다', async () => {
    mockPickers()
    let salesCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, () => {
        salesCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/sales/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '생성 후 상신' }))

    const alerts = await screen.findAllByRole('alert')
    const alertTexts = alerts.map((el) => el.textContent)
    expect(alertTexts).toContain('제목을 입력해주세요')
    expect(alertTexts).toContain('본문을 입력해주세요')
    expect(alertTexts).toContain('대상 가맹점을 선택해주세요')
    expect(alertTexts).toContain('매출 보고월을 선택해주세요')
    expect(alertTexts).toContain('매출액을 입력해주세요')
    expect(salesCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })

  it('빈 값으로 "임시저장으로 생성"을 눌러도 동일한 zod 사전검증을 통과해야 하며 API를 호출하지 않는다', async () => {
    mockPickers()
    let salesCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, () => {
        salesCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '임시저장으로 생성' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map((el) => el.textContent)).toContain('제목을 입력해주세요')
    expect(salesCalled).toBe(false)
  })
})

describe('SalesDraftCreatePage (F760) - FranchisePicker 선택 시 franchiseId 동기화', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('가맹점을 선택하면 franchiseId가 채워져 나머지 필드까지 채운 뒤 결재선만 없으면 root 에러만 남는다', async () => {
    mockPickers()
    let salesCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, () => {
        salesCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/sales/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidFormWithoutFranchise(user)
    await selectFranchise(user)
    await user.click(screen.getByRole('button', { name: '생성 후 상신' }))

    // franchiseId 관련 인라인 에러("대상 가맹점을 선택해주세요")는 더 이상 뜨지 않아야 한다.
    await waitFor(() => {
      expect(screen.queryByText('대상 가맹점을 선택해주세요')).not.toBeInTheDocument()
    })
    expect(
      await screen.findByText('상신하려면 결재선에 최소 1명을 지정해주세요'),
    ).toBeInTheDocument()
    expect(salesCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })
})

describe('SalesDraftCreatePage (F760) - [생성 후 상신] 결재선 0명 클라 가드', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('필드는 정상 입력했지만 결재선을 0명 지정한 채 "생성 후 상신"을 누르면 root 에러가 뜨고 API를 호출하지 않는다', async () => {
    mockPickers()
    let salesCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, () => {
        salesCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/sales/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidFormWithoutFranchise(user)
    await selectFranchise(user)
    await user.click(screen.getByRole('button', { name: '생성 후 상신' }))

    expect(
      await screen.findByText('상신하려면 결재선에 최소 1명을 지정해주세요'),
    ).toBeInTheDocument()
    expect(salesCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })

  it('결재선 0명이어도 "임시저장으로 생성"은 차단되지 않는다(root 에러 없이 API 호출)', async () => {
    mockPickers()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ draftId: 42 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidFormWithoutFranchise(user)
    await selectFranchise(user)
    await user.click(screen.getByRole('button', { name: '임시저장으로 생성' }))

    expect(
      screen.queryByText('상신하려면 결재선에 최소 1명을 지정해주세요'),
    ).not.toBeInTheDocument()
    await waitFor(() => expect(registeredBody).toBeDefined())
    expect(registeredBody?.param).toEqual({
      title: '7월 매출 보고',
      content: '7월 매출 실적을 보고합니다',
      approvers: undefined,
    })
  })
})

describe('SalesDraftCreatePage (F760) - 정상 입력 + 결재선 1명 + [임시저장으로 생성] 해피패스', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('성공(201 {draftId}) 시 param 중첩 구조로 요청을 보내고 상세로 navigate하며 성공 토스트를 띄운다', async () => {
    mockPickers()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ draftId: 55 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidFormWithoutFranchise(user)
    await selectFranchise(user)
    await selectOneApprover(user)
    await user.click(screen.getByRole('button', { name: '임시저장으로 생성' }))

    await waitFor(() =>
      expect(registeredBody).toEqual({
        param: {
          title: '7월 매출 보고',
          content: '7월 매출 실적을 보고합니다',
          approvers: [{ approverId: 101, role: 'APPROVER', order: 1 }],
        },
        franchiseId: 1,
        reportMonth: '2026-07',
        salesAmount: 10000000,
      }),
    )

    expect(await screen.findByText('기안 상세 화면 draftId=55')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('매출 기안서를 임시저장했습니다')
  })
})
