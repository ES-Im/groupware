import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { NewEmployeeApprovalListPage } from './NewEmployeeApprovalListPage'

/**
 * NewEmployeeApprovalListPage(ROADMAP T4.1-c) 페이지 단위 통합 플로우 테스트.
 *
 * 개별 훅/컴포넌트 로직(useNewEmployeesQuery, EmpApprovalWizardDialog, EmpBelongingsAssignmentForm 등)은
 * 각자의 단위 테스트(T4.1-a/b)가 이미 커버하므로, 이 파일은 "페이지가 조립됐을 때"의 흐름만 다룬다:
 * 검색/페이지네이션 재조회, 마법사 1→2단계 전이(성공/실패), 두 mutation의 무효화가 목록에 반영되는지,
 * 승인 후 2단계 이탈 경고.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

// radix-ui Checkbox(react-use-size)가 크기 관측에 ResizeObserver를 쓰는데 jsdom에는 구현이 없다.
// EmpApprovalWizardDialog.test.tsx 선례와 동일 패턴(2단계 EmpBelongingsAssignmentForm이 렌더될 때 필요).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}

function empRecord(empId: number, name: string, loginId: string) {
  return {
    empId,
    empNo: `20260700${empId}`,
    name,
    loginId,
    email: `${loginId}@haruon.com`,
    extensionNo: '',
  }
}

function makePage(items: ReturnType<typeof empRecord>[], overrides?: Record<string, unknown>) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
    ...overrides,
  }
}

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: { deptId, deptCode: String(deptId).padStart(3, '0'), deptName, isActive: true, parentDeptId: null },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function candidatesPage(items: ReturnType<typeof deptSummary>[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 100,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <NewEmployeeApprovalListPage />
    </QueryClientProvider>,
  )
}

/** 1단계에서 입사일자를 입력하고 승인을 제출하는 헬퍼(다이얼로그 스코프 내에서 동작). */
async function submitStep1(user: ReturnType<typeof userEvent.setup>, hiredAt = '2024-03-05') {
  const dialog = screen.getByRole('dialog')
  await user.type(within(dialog).getByLabelText('입사일자'), hiredAt)
  await user.click(within(dialog).getByRole('button', { name: '승인' }))
}

describe('NewEmployeeApprovalListPage - 검색/페이지네이션', () => {
  it('검색어 입력은 디바운스 후에만 keyword로 반영되고, 페이지 이동 시 재조회하며, 빈 목록이면 안내 문구가 뜬다', async () => {
    const requests: Array<{ keyword: string | null; page: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({ keyword: url.searchParams.get('keyword'), page: url.searchParams.get('page') })
        if (page === 1) {
          return HttpResponse.json(makePage([], { totalElements: 0, totalPages: 2, number: 1, first: false, last: true }))
        }
        return HttpResponse.json(
          makePage([empRecord(1, '홍길동', 'hong123')], { totalElements: 11, totalPages: 2, first: true, last: false }),
        )
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('홍길동')
    expect(requests[0].keyword).toBeNull()
    expect(requests[0].page).toBe('0')

    // 페이지 이동 시 재조회 + 빈 목록 안내.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await screen.findByText('가입 대기 중인 사원이 없습니다.')
    expect(requests.some((r) => r.page === '1')).toBe(true)

    // 검색어 입력(디바운스 300ms) — 유예 전에는 반영되지 않는다.
    await user.type(screen.getByLabelText('이름 검색'), '김철수')
    expect(requests.every((r) => r.keyword !== '김철수')).toBe(true)

    await waitFor(() => expect(requests.some((r) => r.keyword === '김철수' && r.page === '0')).toBe(true))
  })
})

describe('NewEmployeeApprovalListPage - 마법사 1→2단계 전이', () => {
  it('1단계 승인 성공 시 2단계(소속 배정 폼)로 자동 전환된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () => HttpResponse.json(makePage([empRecord(7, '홍길동', 'hong123')]))),
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '승인' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await submitStep1(user)

    expect(await within(screen.getByRole('dialog')).findByLabelText('발령시작일')).toHaveValue('2024-03-05')
  })

  it('1단계 승인 실패 시 에러 토스트 후 다이얼로그가 닫히고, 목록이 재조회되어 대상이 그대로 남아있다', async () => {
    let approvalCallCount = 0
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () => HttpResponse.json(makePage([empRecord(7, '홍길동', 'hong123')]))),
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => {
        approvalCallCount += 1
        return HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 승인된 사원입니다' },
          { status: 400 },
        )
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '승인' }))
    await submitStep1(user)

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 승인된 사원입니다'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // 승인만으로는 목록에서 사라지지 않으므로(재조회해도 동일 응답), 대상이 그대로 표에 남아있다.
    expect(approvalCallCount).toBe(1)
    expect(await screen.findByText('홍길동')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '승인' })).toBeInTheDocument()
  })
})

describe('NewEmployeeApprovalListPage - 두 mutation 무효화 반영', () => {
  it('소속배정까지 성공하면 목록에서 해당 사원이 사라진다', async () => {
    let listCallCount = 0
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () => {
        listCallCount += 1
        if (listCallCount === 1) {
          return HttpResponse.json(makePage([empRecord(7, '홍길동', 'hong123')]))
        }
        return HttpResponse.json(makePage([]))
      }),
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
      http.patch(`${BASE_URL}/api/employees/7/belongings`, () => new HttpResponse(null, { status: 204 })),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '승인' }))
    await submitStep1(user)

    const dialog = await screen.findByRole('dialog')
    await within(dialog).findByText('개발본부')
    await user.selectOptions(within(dialog).getByLabelText('부서'), '2')
    await user.selectOptions(within(dialog).getByLabelText('직급'), 'STAFF')
    await user.click(within(dialog).getByRole('button', { name: '소속 등록' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('소속을 배정했습니다'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText('홍길동')).not.toBeInTheDocument())
    expect(await screen.findByText('가입 대기 중인 사원이 없습니다.')).toBeInTheDocument()
    expect(listCallCount).toBeGreaterThanOrEqual(2)
  })
})

describe('NewEmployeeApprovalListPage - 승인 후 2단계 이탈 경고', () => {
  it('승인 완료 후 2단계에서 닫으려 하면 경고 토스트가 뜨고 닫힘은 허용된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () => HttpResponse.json(makePage([empRecord(7, '홍길동', 'hong123')]))),
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '승인' }))
    await submitStep1(user)

    await within(screen.getByRole('dialog')).findByLabelText('발령시작일')

    await user.keyboard('{Escape}')

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('승인은 완료되었으나 소속이 배정되지 않았습니다'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
