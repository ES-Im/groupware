import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseEducationActiveToggleButton } from './FranchiseEducationActiveToggleButton'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderButton(isActive: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <FranchiseEducationActiveToggleButton educationId={1} isActive={isActive} />
    </QueryClientProvider>,
  )
}

describe('FranchiseEducationActiveToggleButton', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('isActive=true면 "비활성화" 트리거 버튼이 노출된다', () => {
    renderButton(true)
    expect(screen.getByRole('button', { name: '비활성화' })).toBeInTheDocument()
  })

  it('isActive=false면 "활성화" 트리거 버튼이 노출된다', () => {
    renderButton(false)
    expect(screen.getByRole('button', { name: '활성화' })).toBeInTheDocument()
  })

  it('트리거 버튼 클릭만으로는 요청이 발생하지 않는다(확인 다이얼로그 필요)', async () => {
    let postCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations/1/deactivation`, () => {
        postCalls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderButton(true)

    await user.click(screen.getByRole('button', { name: '비활성화' }))

    expect(await screen.findByText('교육을 비활성화하시겠습니까?')).toBeInTheDocument()
    expect(postCalls).toBe(0)
  })

  it('비활성화 확인 클릭 시 POST /deactivation이 호출되고 성공 토스트가 뜬다', async () => {
    let postCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations/1/deactivation`, () => {
        postCalls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderButton(true)

    await user.click(screen.getByRole('button', { name: '비활성화' }))
    await user.click(screen.getByRole('button', { name: '비활성화', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('교육을 비활성화했습니다'))
    expect(postCalls).toBe(1)
  })

  it('활성화 확인 클릭 시 POST /activation이 호출되고 성공 토스트가 뜬다', async () => {
    let postCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations/1/activation`, () => {
        postCalls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderButton(false)

    await user.click(screen.getByRole('button', { name: '활성화' }))
    await user.click(screen.getByRole('button', { name: '활성화', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('교육을 활성화했습니다'))
    expect(postCalls).toBe(1)
  })

  it('실패 시 handleApiError로 에러 토스트가 노출된다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations/1/deactivation`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderButton(true)

    await user.click(screen.getByRole('button', { name: '비활성화' }))
    await user.click(screen.getByRole('button', { name: '비활성화', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})
