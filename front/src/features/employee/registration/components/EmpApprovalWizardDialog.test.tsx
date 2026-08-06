import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpApprovalWizardDialog } from './EmpApprovalWizardDialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

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

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  const onApproveSuccess = vi.fn()
  const onApproveError = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <EmpApprovalWizardDialog
        open
        onOpenChange={onOpenChange}
        empId={7}
        empName="홍길동"
        loginId="hong123"
        onApproveSuccess={onApproveSuccess}
        onApproveError={onApproveError}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange, onApproveSuccess, onApproveError }
}

async function submitStep1(user: ReturnType<typeof userEvent.setup>, hiredAt = '2024-03-05') {
  await user.type(screen.getByLabelText('입사일자'), hiredAt)
  await user.click(screen.getByRole('button', { name: '승인' }))
}

describe('EmpApprovalWizardDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('1단계: 사원 요약·입사일자 입력·단계 표시기가 렌더된다', () => {
    renderDialog()

    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('hong123')).toBeInTheDocument()
    expect(screen.getByLabelText('입사일자')).toBeInTheDocument()
    expect(screen.getByText('가입 승인')).toBeInTheDocument()
    expect(screen.getByText('소속 배정')).toBeInTheDocument()
  })

  it('1단계: 입사일자를 비우고 제출하면 유효성 에러가 표시되고 승인 요청이 발생하지 않는다', async () => {
    let called = false
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '승인' }))

    expect(await screen.findByText('입사일자를 올바르게 입력해주세요')).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('1단계 승인 성공 시 onApproveSuccess가 호출되고 2단계(소속 배정 폼)로 전환된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )
    const user = userEvent.setup()
    const { onApproveSuccess } = renderDialog()

    await submitStep1(user)

    await waitFor(() => expect(onApproveSuccess).toHaveBeenCalledWith('2024-03-05'))
    expect(await screen.findByLabelText('발령시작일')).toHaveValue('2024-03-05')
  })

  it('1단계 승인 실패 시 onApproveError로 에러를 위임하고 2단계로 전환하지 않는다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 승인된 사원입니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onApproveError, onApproveSuccess } = renderDialog()

    await submitStep1(user)

    await waitFor(() => expect(onApproveError).toHaveBeenCalled())
    expect(onApproveSuccess).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('발령시작일')).not.toBeInTheDocument()
    expect(screen.getByLabelText('입사일자')).toBeInTheDocument()
  })

  it('1단계 제출 중에는 Esc로 닫을 수 없다', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await submitStep1(user)

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()

    resolveResponse?.()
    await waitFor(() => expect(screen.queryByLabelText('입사일자')).not.toBeInTheDocument())
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('2단계에서 배정 진행 중(assignMutation.isPending)에는 Esc로 닫을 수 없다', async () => {
    let resolveAssign: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveAssign = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
      http.patch(`${BASE_URL}/api/employees/7/belongings`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await submitStep1(user)
    await screen.findByText('개발본부')
    await user.selectOptions(screen.getByLabelText('부서'), '2')
    await user.selectOptions(screen.getByLabelText('직급'), 'STAFF')
    await user.click(screen.getByRole('button', { name: '소속 등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '소속 등록' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()

    resolveAssign?.()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('2단계에서 배정 전 닫기를 시도하면 경고 토스트가 뜨고 닫힌다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/registration-approval`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await submitStep1(user)
    await screen.findByLabelText('발령시작일')

    await user.keyboard('{Escape}')

    const { toast } = await import('sonner')
    expect(toast.warning).toHaveBeenCalledWith('승인은 완료되었으나 소속이 배정되지 않았습니다')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
