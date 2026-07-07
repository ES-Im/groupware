import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EndDepartmentLeaderDialog } from './EndDepartmentLeaderDialog'

/**
 * EndDepartmentLeaderDialog(F209, T9.3) 검증.
 * 단일 날짜 입력 폼의 표준 닫힘 가드/실패 비삼킴 패턴을 확인한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <EndDepartmentLeaderDialog
        open={open}
        onOpenChange={onOpenChange}
        deptId={1}
        currentLeaderName="홍길동"
      />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('EndDepartmentLeaderDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('현재 부서장 이름을 안내 문구에 표시한다', () => {
    renderDialog()
    expect(screen.getByText(/현재 부서장\(홍길동\)/)).toBeInTheDocument()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출한다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '종료' }))

    expect(await screen.findByText('종료일을 선택해주세요')).toBeInTheDocument()
  })

  it('제출 중에는 취소 버튼/Esc로 닫을 수 없고, 응답 도착 후 닫힌다(성공)', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/end`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/종료일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '종료' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('부서장을 종료했습니다')
  })

  it('서버 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/end`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '종료일이 지정일보다 앞설 수 없습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/종료일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '종료' }))

    expect(await screen.findByText('종료일이 지정일보다 앞설 수 없습니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
