import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { CompanyContactEditDialog } from './CompanyContactEditDialog'

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
      <CompanyContactEditDialog
        open={open}
        onOpenChange={onOpenChange}
        currentPresentedEmail="contact@haruon.com"
        currentPresentedExternalNo="02-1234-5678"
      />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('CompanyContactEditDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('열릴 때 현재 조회값으로 입력값이 채워진다', () => {
    renderDialog()

    expect(screen.getByLabelText('대표 이메일')).toHaveValue('contact@haruon.com')
    expect(screen.getByLabelText('대표 연락처')).toHaveValue('02-1234-5678')
  })

  it('프리필값 그대로 제출(무변경)하면 root 에러를 노출하고 요청을 보내지 않는다', async () => {
    const postSpy = vi.fn()
    server.use(
      http.post(`${BASE_URL}/api/companies/contact`, () => {
        postSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('변경할 값을 하나 이상 입력해주세요')).toBeInTheDocument()
    expect(postSpy).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('이메일 형식이 올바르지 않으면 zod 검증 에러를 노출한다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.clear(screen.getByLabelText('대표 이메일'))
    await user.type(screen.getByLabelText('대표 이메일'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument()
  })

  it('대표 연락처를 공백만으로 지우면 zod 검증 에러를 노출한다(공백-only 거부)', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.clear(screen.getByLabelText('대표 연락처'))
    await user.type(screen.getByLabelText('대표 연락처'), '   ')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(
      await screen.findByText('연락처는 공백만으로 입력할 수 없습니다'),
    ).toBeInTheDocument()
  })

  it('값을 실제로 변경하면 성공(204) 시 성공 토스트가 뜨고 다이얼로그가 닫힌다', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE_URL}/api/companies/contact`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByLabelText('대표 이메일'))
    await user.type(screen.getByLabelText('대표 이메일'), 'new@haruon.com')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('회사 연락처를 수정했습니다')
    expect(capturedBody).toMatchObject({ presentedEmail: 'new@haruon.com' })
  })

  it('서버 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.post(`${BASE_URL}/api/companies/contact`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이메일 형식이 올바르지 않습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByLabelText('대표 이메일'))
    await user.type(screen.getByLabelText('대표 이메일'), 'new@haruon.com')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(
      await screen.findByText('이메일 형식이 올바르지 않습니다'),
    ).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
