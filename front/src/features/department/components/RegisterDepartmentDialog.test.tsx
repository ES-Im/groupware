import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { RegisterDepartmentDialog } from './RegisterDepartmentDialog'

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
      <RegisterDepartmentDialog open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('RegisterDepartmentDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출하고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('부서 코드는 3자리 숫자로 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('부서명을 입력해주세요')).toBeInTheDocument()
  })

  it('부서코드가 3자리 숫자가 아니면 zod 검증 에러를 노출한다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText(/부서 코드/), '12')
    await user.type(screen.getByLabelText(/부서명/), '개발팀')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('부서 코드는 3자리 숫자로 입력해주세요')).toBeInTheDocument()
  })

  it('제출 중에는 Esc/취소 버튼으로 닫을 수 없고, 응답 도착 후에는 닫힌다(성공)', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${BASE_URL}/api/departments`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/부서 코드/), '123')
    await user.type(screen.getByLabelText(/부서명/), '개발팀')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('부서를 등록했습니다')
  })

  it('서버 검증 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.post(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 존재하는 부서 코드입니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/부서 코드/), '123')
    await user.type(screen.getByLabelText(/부서명/), '개발팀')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('이미 존재하는 부서 코드입니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText(/부서 코드/)).toHaveValue('123')
  })
})
