import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { RenameDepartmentForm } from './RenameDepartmentForm'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RenameDepartmentForm deptId={1} currentName="본사" />
    </QueryClientProvider>,
  )
}

describe('RenameDepartmentForm', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('현재 부서명으로 입력값이 채워진다', () => {
    renderForm()
    expect(screen.getByRole('textbox', { name: /부서명/ })).toHaveValue('본사')
  })

  it('부서명을 비우면 zod 검증 에러를 노출한다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.clear(screen.getByRole('textbox', { name: /부서명/ }))
    await user.click(screen.getByRole('button', { name: '변경' }))

    expect(await screen.findByText('부서명을 입력해주세요')).toBeInTheDocument()
  })

  it('성공하면 성공 토스트를 띄운다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/name`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderForm()

    await user.clear(screen.getByRole('textbox', { name: /부서명/ }))
    await user.type(screen.getByRole('textbox', { name: /부서명/ }), '개발본부')
    await user.click(screen.getByRole('button', { name: '변경' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('부서명을 변경했습니다'))
  })

  it('서버 실패 시 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/name`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 존재하는 부서명입니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderForm()

    await user.clear(screen.getByRole('textbox', { name: /부서명/ }))
    await user.type(screen.getByRole('textbox', { name: /부서명/ }), '개발본부')
    await user.click(screen.getByRole('button', { name: '변경' }))

    expect(await screen.findByText('이미 존재하는 부서명입니다')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).not.toHaveBeenCalled()
  })
})
