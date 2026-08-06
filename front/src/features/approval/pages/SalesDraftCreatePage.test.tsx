import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { SalesDraftCreatePage } from './SalesDraftCreatePage'

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
          { empId: 102, empNo: 'E102', empName: '이영희', extensionNo: null, email: 'lee@haruon.com', position: '대리' },
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
  await user.clear(screen.getByLabelText(/^기안 내용/))
  await user.type(screen.getByLabelText(/^기안 내용/), '7월 매출 실적을 보고합니다')
  fireEvent.change(screen.getByLabelText(/매출 보고월/), { target: { value: '2026-07' } })
  fireEvent.change(screen.getByLabelText(/매출액/), { target: { value: '10000000' } })
}

function monthlySalesFixture() {
  return {
    franchiseId: 1,
    franchiseName: '테스트강남점',
    salesMonth: 202607,
    totalSalesAmount: 12450000,
    totalOrderCount: 100,
    averageOrderAmount: 1.0,
    averageDailySalesAmount: 10000.0,
    salesDays: 30,
    dailySales: [],
  }
}

async function selectFranchise(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /테스트강남점/ }))
}

async function selectOneApprover(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '결재선 추가' }))
  await user.click(await screen.findByRole('button', { name: '개발팀' }))
  await user.click(await screen.findByRole('button', { name: /김철수/ }))
  await user.click(screen.getByRole('button', { name: '완료' }))
}

async function selectOneCirculation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '공람 (선택) 추가' }))
  const dialog = await screen.findByRole('dialog')
  await user.click(await within(dialog).findByRole('button', { name: '개발팀' }))
  await user.click(await within(dialog).findByRole('button', { name: /이영희/ }))
  await user.click(within(dialog).getByRole('button', { name: '완료' }))
}

describe('SalesDraftCreatePage (F760) - zod 사전검증(빈 값)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값으로 "생성 후 상신"을 눌러도 4개 필드 인라인 에러를 보여주고 API를 호출하지 않는다(본문은 자동 입력이라 비지 않는다)', async () => {
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

    await user.click(screen.getByRole('button', { name: '상신' }))

    const alerts = await screen.findAllByRole('alert')
    const alertTexts = alerts.map((el) => el.textContent)
    expect(alertTexts).toContain('제목을 입력해주세요')
    expect(alertTexts).toContain('대상 가맹점을 선택해주세요')
    expect(alertTexts).toContain('매출 보고월을 선택해주세요')
    expect(alertTexts).toContain('매출액을 입력해주세요')
    expect(alertTexts).not.toContain('기안 내용을 입력해주세요')
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

    await user.click(screen.getByRole('button', { name: '임시저장' }))

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
    await user.click(screen.getByRole('button', { name: '상신' }))

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
    await user.click(screen.getByRole('button', { name: '상신' }))

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
    await user.click(screen.getByRole('button', { name: '임시저장' }))

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

describe('SalesDraftCreatePage (F760) - [매출액 불러오기](FRANCHISE_SALES_MONTHLY)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('가맹점·보고월 선택 후 누르면 월 매출 totalSalesAmount가 매출액 필드에 주입되고 성공 토스트가 뜬다', async () => {
    mockPickers()
    let monthlySalesCalled = false
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/months/2026-07`, () => {
        monthlySalesCalled = true
        return HttpResponse.json(monthlySalesFixture())
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await selectFranchise(user)
    fireEvent.change(screen.getByLabelText(/매출 보고월/), { target: { value: '2026-07' } })
    await user.click(screen.getByRole('button', { name: '매출액 불러오기' }))

    await waitFor(() => expect(screen.getByLabelText(/매출액/)).toHaveValue(12450000))
    expect(monthlySalesCalled).toBe(true)
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('테스트강남점의 2026-07 월 매출을 불러왔습니다')
  })

  it('가맹점을 선택하지 않고 누르면 안내 토스트만 띄우고 API를 호출하지 않는다', async () => {
    mockPickers()
    let monthlySalesCalled = false
    server.use(
      http.get(`${BASE_URL}/api/franchises/:franchiseId/sales/months/:yearMonth`, () => {
        monthlySalesCalled = true
        return HttpResponse.json(monthlySalesFixture())
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '매출액 불러오기' }))

    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith('매출액을 불러오려면 대상 가맹점을 먼저 선택해주세요')
    expect(monthlySalesCalled).toBe(false)
  })

  it('매출 데이터가 없는 월(204 빈 바디)은 "매출 데이터가 없습니다" 토스트를 띄우고 필드를 주입하지 않는다', async () => {
    mockPickers()
    server.use(
      http.get(
        `${BASE_URL}/api/franchises/1/sales/months/2026-07`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()

    await selectFranchise(user)
    fireEvent.change(screen.getByLabelText(/매출 보고월/), { target: { value: '2026-07' } })
    await user.click(screen.getByRole('button', { name: '매출액 불러오기' }))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('2026-07에는 매출 데이터가 없습니다'),
    )
    expect(toast.success).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/매출액/)).toHaveValue(null)
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
    await user.click(screen.getByRole('button', { name: '임시저장' }))

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

describe('SalesDraftCreatePage (F760) - 공람 지정(생성 성공 후 F707 후속 호출)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('공람자 1명 + "임시저장으로 생성" 성공 시 POST /api/drafts/{draftId}/circulations가 {empIds}로 호출되고 상세로 navigate한다', async () => {
    mockPickers()
    let circulationDraftId: string | readonly string[] | undefined
    let circulationBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, () =>
        HttpResponse.json({ draftId: 77 }, { status: 201 }),
      ),
      http.post(`${BASE_URL}/api/drafts/:draftId/circulations`, async ({ request, params }) => {
        circulationDraftId = params.draftId
        circulationBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidFormWithoutFranchise(user)
    await selectFranchise(user)
    await selectOneCirculation(user)
    await user.click(screen.getByRole('button', { name: '임시저장' }))

    expect(await screen.findByText('기안 상세 화면 draftId=77')).toBeInTheDocument()
    expect(circulationDraftId).toBe('77')
    expect(circulationBody).toEqual({ empIds: [102] })
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('매출 기안서를 임시저장했습니다')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('공람 추가가 실패(500)해도 성공 토스트·상세 navigate는 유지되고 공람 실패 에러 토스트가 추가로 뜬다', async () => {
    mockPickers()
    server.use(
      http.post(`${BASE_URL}/api/drafts/sales`, () =>
        HttpResponse.json({ draftId: 88 }, { status: 201 }),
      ),
      http.post(`${BASE_URL}/api/drafts/:draftId/circulations`, () =>
        HttpResponse.json(
          {
            code: 'SYSTEM_001',
            name: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            message: '서버 오류가 발생했습니다',
          },
          { status: 500 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidFormWithoutFranchise(user)
    await selectFranchise(user)
    await selectOneCirculation(user)
    await user.click(screen.getByRole('button', { name: '임시저장' }))

    expect(await screen.findByText('기안 상세 화면 draftId=88')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('매출 기안서를 임시저장했습니다')
    expect(toast.error).toHaveBeenCalledWith(
      '공람자 지정에 실패했습니다. 상세 화면에서 다시 추가해주세요',
    )
  })
})
