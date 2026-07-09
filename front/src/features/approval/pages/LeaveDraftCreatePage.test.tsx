import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { LeaveDraftCreatePage } from './LeaveDraftCreatePage'

/**
 * LeaveDraftCreatePage(F740 `LEAVE_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(LEAVE) T1.3) 회귀 방지
 * 테스트. ③BusinessTripDraftCreatePage(F730)의 폼 로직을 동형 이식한 페이지라 검증 축도 동형이다:
 *   - zod 사전검증(빈 값 제출 시 인라인 에러, 두 버튼 모두 동일 검증) — API 미호출.
 *   - [생성 후 상신] 결재선 0명 클라 가드(root 에러) — API 미호출.
 *   - 정상 입력 + 결재선 1명 지정 후 [임시저장으로 생성] 성공 시 상세로 navigate + 성공 토스트.
 *
 * EmployeePicker(결재선)는 department 도메인의 useDepartmentsQuery/useDepartmentMembersQuery를
 * 그대로 재사용하므로, 이 페이지가 마운트되는 순간 GET /api/departments가 항상 나간다 — 모든
 * 테스트 케이스에서 목이 필요하다(onUnhandledRequest:'error').
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

/** EmployeePicker가 항상 마운트 즉시 조회하는 부서 목록 + 부서 선택 후 조회하는 부서원 목록 목. */
function mockEmployeePicker() {
  server.use(
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
      <MemoryRouter initialEntries={['/approval/drafts/leaves/new']}>
        <Routes>
          <Route path="/approval/drafts/leaves/new" element={<LeaveDraftCreatePage />} />
          <Route path="/approval/drafts/:draftId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^제목/), '연차 신청')
  await user.type(screen.getByLabelText(/^본문/), '개인 사정으로 연차를 신청합니다')
  await user.selectOptions(screen.getByLabelText(/휴가 유형/), '연차')
  fireEvent.change(screen.getByLabelText(/휴가 시작 일시/), { target: { value: '2026-07-10T09:00' } })
  fireEvent.change(screen.getByLabelText(/휴가 종료 일시/), { target: { value: '2026-07-10T18:00' } })
}

async function selectOneApprover(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '개발팀' }))
  await user.click(await screen.findByRole('button', { name: /김철수/ }))
}

describe('LeaveDraftCreatePage (F740) - zod 사전검증(빈 값)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값으로 "생성 후 상신"을 눌러도 5개 필드 인라인 에러를 보여주고 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
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
    expect(alertTexts).toContain('휴가 유형을 선택해주세요')
    expect(alertTexts).toContain('휴가 시작 일시를 입력해주세요')
    expect(alertTexts).toContain('휴가 종료 일시를 입력해주세요')
    expect(leaveCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })

  it('빈 값으로 "임시저장으로 생성"을 눌러도 동일한 zod 사전검증을 통과해야 하며 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '임시저장으로 생성' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map((el) => el.textContent)).toContain('제목을 입력해주세요')
    expect(leaveCalled).toBe(false)
  })
})

describe('LeaveDraftCreatePage (F740) - [생성 후 상신] 결재선 0명 클라 가드', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('필드는 정상 입력했지만 결재선을 0명 지정한 채 "생성 후 상신"을 누르면 root 에러가 뜨고 API를 호출하지 않는다', async () => {
    mockEmployeePicker()
    let leaveCalled = false
    let submissionCalled = false
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, () => {
        leaveCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
      http.post(`${BASE_URL}/api/drafts/leaves/submission`, () => {
        submissionCalled = true
        return HttpResponse.json({ draftId: 1 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '생성 후 상신' }))

    expect(
      await screen.findByText('상신하려면 결재선에 최소 1명을 지정해주세요'),
    ).toBeInTheDocument()
    expect(leaveCalled).toBe(false)
    expect(submissionCalled).toBe(false)
  })
})

describe('LeaveDraftCreatePage (F740) - 정상 입력 + 결재선 1명 + [임시저장으로 생성] 해피패스', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('성공(201 {draftId}) 시 param 중첩 구조로 요청을 보내고 상세로 navigate하며 성공 토스트를 띄운다', async () => {
    mockEmployeePicker()
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/drafts/leaves`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ draftId: 55 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await selectOneApprover(user)
    await user.click(screen.getByRole('button', { name: '임시저장으로 생성' }))

    await waitFor(() =>
      expect(registeredBody).toEqual({
        param: {
          title: '연차 신청',
          content: '개인 사정으로 연차를 신청합니다',
          approvers: [{ approverId: 101, role: 'APPROVER', order: 1 }],
        },
        startAt: '2026-07-10T09:00:00',
        endAt: '2026-07-10T18:00:00',
        leaveType: 'ANNUAL',
      }),
    )

    expect(await screen.findByText('기안 상세 화면 draftId=55')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('휴가 기안서를 임시저장했습니다')
  })
})
