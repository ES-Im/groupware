import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EndDepartmentLeaderForm } from './EndDepartmentLeaderForm'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <EndDepartmentLeaderForm deptId={1} currentLeaderName="홍길동" />
    </QueryClientProvider>,
  )
}

describe('EndDepartmentLeaderForm', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('현재 부서장 이름을 안내 문구에 표시한다', () => {
    renderForm()
    expect(screen.getByText(/현재 부서장/)).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출한다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: '부서장 종료' }))

    expect(await screen.findByText('종료일을 선택해주세요')).toBeInTheDocument()
  })

  it('성공하면 성공 토스트를 띄운다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/end`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/종료일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '부서장 종료' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('부서장을 종료했습니다'))
  })

  it('서버 실패 시 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/end`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '종료일이 지정일보다 앞설 수 없습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/종료일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '부서장 종료' }))

    expect(await screen.findByText('종료일이 지정일보다 앞설 수 없습니다')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).not.toHaveBeenCalled()
  })
})
