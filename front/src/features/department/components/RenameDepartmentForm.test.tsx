import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { RenameDepartmentDialog } from './RenameDepartmentDialog'

/**
 * RenameDepartmentDialog(F206, T9.2) 검증.
 * RegisterDepartmentDialog와 동일한 표준 패턴(닫힘 가드·실패 비삼킴)이 이 다이얼로그에도
 * 동일하게 적용돼 있는지 확인한다.
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
      <RenameDepartmentDialog open={open} onOpenChange={onOpenChange} deptId={1} currentName="본사" />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('RenameDepartmentDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('열릴 때 현재 부서명으로 입력값이 채워진다', () => {
    renderDialog()
    expect(screen.getByRole('textbox', { name: /부서명/ })).toHaveValue('본사')
  })

  it('부서명을 비우면 zod 검증 에러를 노출한다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.clear(screen.getByRole('textbox', { name: /부서명/ }))
    await user.click(screen.getByRole('button', { name: '변경' }))

    expect(await screen.findByText('부서명을 입력해주세요')).toBeInTheDocument()
  })

  it('제출 중에는 취소 버튼/Esc로 닫을 수 없고, 응답 도착 후 닫힌다(성공)', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/name`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByRole('textbox', { name: /부서명/ }))
    await user.type(screen.getByRole('textbox', { name: /부서명/ }), '개발본부')
    await user.click(screen.getByRole('button', { name: '변경' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('부서명을 변경했습니다')
  })

  it('서버 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/name`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 존재하는 부서명입니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByRole('textbox', { name: /부서명/ }))
    await user.type(screen.getByRole('textbox', { name: /부서명/ }), '개발본부')
    await user.click(screen.getByRole('button', { name: '변경' }))

    expect(await screen.findByText('이미 존재하는 부서명입니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
