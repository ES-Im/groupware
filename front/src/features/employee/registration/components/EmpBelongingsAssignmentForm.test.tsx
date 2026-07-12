import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpBelongingsAssignmentForm } from './EmpBelongingsAssignmentForm'

/**
 * EmpBelongingsAssignmentForm(T3.6, `HR_UPDATE_EMP_BELONGINGS` 2단계 폼) 검증.
 * mutation을 직접 호출하지 않는 자체완결형 폼이라 onSubmit prop 스파이로 조립된 값만 확인한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// radix-ui Checkbox(react-use-size)가 크기 관측에 ResizeObserver를 쓰는데 jsdom에는 구현이 없다.
// no-op 스텁으로 충분하다(전역 setup 수정 금지 제약에 따라 테스트 파일 로컬로만 주입,
// ScheduleDetailDialog.test.tsx 선례와 동일 패턴).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
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

function renderForm(onSubmit: (values: unknown) => Promise<void>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <EmpBelongingsAssignmentForm defaultStartAt="2024-03-05" onSubmit={onSubmit} />
    </QueryClientProvider>,
  )
}

describe('EmpBelongingsAssignmentForm', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('부서/직급/주요소속/발령시작일 필드가 렌더되고, startAt은 defaultStartAt으로 프리필된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )

    renderForm(vi.fn())

    await screen.findByText('개발본부')
    expect(screen.getByLabelText('부서')).toBeInTheDocument()
    expect(screen.getByLabelText('직급')).toBeInTheDocument()
    expect(screen.getByLabelText('발령시작일')).toHaveValue('2024-03-05')
    expect(screen.getByText('신규 소속은 항상 주요 소속으로 등록됩니다.')).toBeInTheDocument()
  })

  it('부서·직급을 선택하지 않고 제출하면 필수 에러가 표시되고 onSubmit이 호출되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderForm(onSubmit)

    await screen.findByText('개발본부')
    await user.click(screen.getByRole('button', { name: '소속 등록' }))

    expect(await screen.findByText('부서를 선택해주세요')).toBeInTheDocument()
    expect(screen.getByText('직급을 선택해주세요')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('4필드를 모두 채우면 onSubmit이 조립된 값으로 호출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderForm(onSubmit)

    await screen.findByText('개발본부')
    await user.selectOptions(screen.getByLabelText('부서'), '2')
    await user.selectOptions(screen.getByLabelText('직급'), 'STAFF')
    await user.click(screen.getByRole('button', { name: '소속 등록' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { deptId: '2', position: 'STAFF', isPrimary: true, startAt: '2024-03-05' },
        expect.anything(),
      ),
    )
  })
})
