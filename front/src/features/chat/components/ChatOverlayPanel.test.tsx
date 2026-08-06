import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatOverlayPanel } from './ChatOverlayPanel'

vi.mock('../lib/stompClient', () => ({
  connectChatStomp: vi.fn(),
  disconnectChatStomp: vi.fn(),
}))

const { connectChatStomp, disconnectChatStomp } = await import('../lib/stompClient')

function meFixture() {
  return {
    empBasicInfo: {
      empId: 1,
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  useChatOverlayStore.setState({ isOpen: false, selectedRoomId: null })
  server.use(
    http.get(`${BASE_URL}/api/chat/rooms`, () => HttpResponse.json([])),
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())),
    http.get(`${BASE_URL}/api/chat/rooms/:roomId`, ({ params }) =>
      HttpResponse.json({
        roomId: Number(params.roomId),
        roomName: '테스트방',
        isGroup: false,
        lastReadMessageId: null,
        members: [],
      }),
    ),
    http.get(`${BASE_URL}/api/chat/rooms/:roomId/messages`, () =>
      HttpResponse.json({ messages: [], nextCursor: null, hasNext: false }),
    ),
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ChatOverlayPanel', () => {
  it('isOpen=false면 아무것도 렌더하지 않고 STOMP도 연결하지 않는다', () => {
    const { container } = renderWithProviders(<ChatOverlayPanel />)

    expect(container.firstChild).toBeNull()
    expect(connectChatStomp).not.toHaveBeenCalled()
  })

  it('isOpen=true로 전환되면 오버레이가 렌더되고 connectChatStomp가 1번 호출된다', () => {
    const { unmount } = renderWithProviders(<ChatOverlayPanel />)
    expect(connectChatStomp).not.toHaveBeenCalled()

    act(() => {
      useChatOverlayStore.setState({ isOpen: true })
    })

    expect(screen.getByText('채팅')).toBeInTheDocument()
    expect(connectChatStomp).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('마운트 시점부터 isOpen=true면 렌더와 동시에 connectChatStomp가 1번 호출된다', () => {
    useChatOverlayStore.setState({ isOpen: true })

    const { unmount } = renderWithProviders(<ChatOverlayPanel />)

    expect(screen.getByText('채팅')).toBeInTheDocument()
    expect(connectChatStomp).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('언마운트 시 disconnectChatStomp가 1번 호출된다', () => {
    useChatOverlayStore.setState({ isOpen: true })
    const { unmount } = renderWithProviders(<ChatOverlayPanel />)
    expect(connectChatStomp).toHaveBeenCalledTimes(1)

    unmount()

    expect(disconnectChatStomp).toHaveBeenCalledTimes(1)
  })

  it('닫기 버튼(스토어 close → isOpen=false 전환) 클릭 시 disconnectChatStomp가 1번 호출된다', async () => {
    useChatOverlayStore.setState({ isOpen: true })
    const { unmount } = renderWithProviders(<ChatOverlayPanel />)
    expect(connectChatStomp).toHaveBeenCalledTimes(1)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '채팅 닫기' }))

    expect(useChatOverlayStore.getState().isOpen).toBe(false)
    expect(disconnectChatStomp).toHaveBeenCalledTimes(1)
    unmount()
  })
})

function NavShell() {
  const navigate = useNavigate()
  return (
    <div>
      <button type="button" onClick={() => navigate('/b')}>
        go-b
      </button>
      <Routes>
        <Route path="/a" element={<p>Page A</p>} />
        <Route path="/b" element={<p>Page B</p>} />
      </Routes>
      <ChatOverlayPanel />
    </div>
  )
}

describe('ChatOverlayPanel 배경 라우팅 독립성', () => {
  it('오버레이가 열린 상태에서 배경 라우트가 바뀌어도 오버레이 상태가 유지되고 재연결이 발생하지 않는다', async () => {
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 42, screen: 'room' })
    const { unmount } = renderWithProviders(
      <MemoryRouter initialEntries={['/a']}>
        <NavShell />
      </MemoryRouter>,
    )
    expect(screen.getByText('Page A')).toBeInTheDocument()
    expect(connectChatStomp).toHaveBeenCalledTimes(1)

    const user = userEvent.setup()
    await user.click(screen.getByText('go-b'))

    expect(screen.getByText('Page B')).toBeInTheDocument()
    expect(useChatOverlayStore.getState().isOpen).toBe(true)
    expect(useChatOverlayStore.getState().selectedRoomId).toBe(42)
    expect(connectChatStomp).toHaveBeenCalledTimes(1)
    expect(disconnectChatStomp).not.toHaveBeenCalled()
    unmount()
  })
})
