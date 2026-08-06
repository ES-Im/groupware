import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomActiveToggleButton } from './MeetingRoomActiveToggleButton'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderButton(
  isAvailable: boolean,
  onParentClick: () => void,
  variant?: 'switch' | 'button',
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <div onClick={onParentClick}>
        <MeetingRoomActiveToggleButton meetingRoomId={1} isAvailable={isAvailable} variant={variant} />
      </div>
    </QueryClientProvider>,
  )
}

describe('MeetingRoomActiveToggleButton', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('isAvailable=true면 "비활성화" 트리거 버튼이 노출된다', () => {
    renderButton(true, vi.fn())
    expect(screen.getByRole('button', { name: '비활성화' })).toBeInTheDocument()
  })

  it('isAvailable=false면 "활성화" 트리거 버튼이 노출된다', () => {
    renderButton(false, vi.fn())
    expect(screen.getByRole('button', { name: '활성화' })).toBeInTheDocument()
  })

  it('트리거 버튼 클릭만으로는 요청이 발생하지 않고, 부모 클릭 핸들러도 stopPropagation으로 호출되지 않는다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/deactivate`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const onParentClick = vi.fn()
    const user = userEvent.setup()
    renderButton(true, onParentClick)

    await user.click(screen.getByRole('button', { name: '비활성화' }))

    expect(await screen.findByText('회의실을 비활성화하시겠습니까?')).toBeInTheDocument()
    expect(patchSpy).not.toHaveBeenCalled()
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('비활성화 확인 클릭 시 deactivate mutation이 호출되고 성공 토스트가 뜬다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/deactivate`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderButton(true, vi.fn())

    await user.click(screen.getByRole('button', { name: '비활성화' }))
    await user.click(screen.getByRole('button', { name: '비활성화', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('회의실을 비활성화했습니다'))
  })

  it('활성화 확인 클릭 시 activate mutation이 호출되고 성공 토스트가 뜬다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/activate`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderButton(false, vi.fn())

    await user.click(screen.getByRole('button', { name: '활성화' }))
    await user.click(screen.getByRole('button', { name: '활성화', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('회의실을 활성화했습니다'))
  })

  it('variant="switch"는 role="switch" 트리거를 노출하고 aria-checked로 활성 상태를 반영한다', () => {
    renderButton(true, vi.fn(), 'switch')
    const sw = screen.getByRole('switch', { name: '회의실 비활성화' })
    expect(sw).toBeInTheDocument()
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('variant="switch" 조작만으로는 요청이 없고 확인 다이얼로그가 열리며, 부모 클릭도 트리거되지 않는다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/deactivate`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const onParentClick = vi.fn()
    const user = userEvent.setup()
    renderButton(true, onParentClick, 'switch')

    await user.click(screen.getByRole('switch', { name: '회의실 비활성화' }))

    expect(await screen.findByText('회의실을 비활성화하시겠습니까?')).toBeInTheDocument()
    expect(patchSpy).not.toHaveBeenCalled()
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('variant="switch" 확인 클릭 시 deactivate mutation이 호출되고 성공 토스트가 뜬다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/deactivate`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderButton(true, vi.fn(), 'switch')

    await user.click(screen.getByRole('switch', { name: '회의실 비활성화' }))
    await user.click(screen.getByRole('button', { name: '비활성화' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('회의실을 비활성화했습니다'))
  })

  it('실패 시 handleApiError로 에러 토스트가 노출된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/deactivate`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderButton(true, vi.fn())

    await user.click(screen.getByRole('button', { name: '비활성화' }))
    await user.click(screen.getByRole('button', { name: '비활성화', hidden: false }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})
