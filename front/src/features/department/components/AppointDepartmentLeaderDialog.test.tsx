import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { DeptMemberResponse } from '../model/deptMember'
import { AppointDepartmentLeaderDialog } from './AppointDepartmentLeaderDialog'

/**
 * AppointDepartmentLeaderDialog(F208, T9.2) 검증.
 * 멤버 선택 콤보박스 + 날짜 입력 조합의 표준 닫힘 가드/실패 비삼킴 패턴을 확인한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const members: DeptMemberResponse[] = [
  { empId: 1, empNo: 'E001', empName: '홍길동', extensionNo: null, email: 'hong@haruon.com', position: '사원' },
  { empId: 2, empNo: 'E002', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '대리' },
]

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <AppointDepartmentLeaderDialog open={open} onOpenChange={onOpenChange} deptId={1} members={members} />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('AppointDepartmentLeaderDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출한다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '지정' }))

    expect(await screen.findByText('부서장으로 지정할 사원을 선택해주세요')).toBeInTheDocument()
    expect(screen.getByText('지정일을 선택해주세요')).toBeInTheDocument()
  })

  it('제출 중에는 취소 버튼/Esc로 닫을 수 없고, 응답 도착 후 닫힌다(성공)', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/appointment`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.selectOptions(screen.getByRole('combobox'), '1')
    await user.type(screen.getByLabelText(/지정일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '지정' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('부서장을 지정했습니다')
  })

  it('서버 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/appointment`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 부서장이 지정되어 있습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.selectOptions(screen.getByRole('combobox'), '1')
    await user.type(screen.getByLabelText(/지정일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '지정' }))

    expect(await screen.findByText('이미 부서장이 지정되어 있습니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
