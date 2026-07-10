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

/**
 * ChatOverlayPanel(팝업 창 → 인앱 오버레이 전환) 검증.
 *
 * - isOpen=false면 스스로 null을 반환해 아무것도 렌더하지 않는다(조건부 마운트).
 * - isOpen=true 전환 시 실제로 렌더되고, 그 React 마운트가 connectChatStomp 호출을 트리거한다.
 * - 언마운트(닫힘)는 disconnectChatStomp 호출을 트리거한다.
 *
 * STOMP 프로토콜 자체(CONNECT/CONNECTED 왕복 등)는 stompClient.test.ts/
 * useChatRoomSubscription.test.tsx가 이미 FakeStompSocket으로 검증했으므로, 여기서는
 * "마운트/언마운트가 정확히 connect/disconnect 호출로 이어지는가"라는 이 컴포넌트 자신의
 * 배선만 검증한다 — lib/stompClient 모듈 자체를 vi.mock으로 대체한다.
 *
 * isOpen=true일 때 실제로 렌더되는 ChatOverlayPanelContent는 screen==='home'(또는
 * selectedRoomId===null 방어 폴백)이면 ChatHomeScreen(기본 활성 탭인 채팅창목록 →
 * ChatRoomListPanel + useMeQuery)을, screen==='room'이면 ChatRoomDetailPanel을 그린다 — 이
 * 컴포넌트 자신의 배선(mount/unmount → connect/disconnect)만 보려는 목적이라, 그 하위 조회는
 * 최소 MSW 목으로만 흘려보낸다(QueryClient도 매 렌더 함께 주입).
 */

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
    // 배경 라우팅 독립성 테스트가 selectedRoomId를 채운 채로 시작해 ChatRoomDetailPanel을
    // 렌더하므로, 그 하위 조회(CHAT_ROOM_DETAIL/CHAT_MESSAGES)도 함께 흘려보낸다.
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

/**
 * 배경 라우팅 독립성 회귀 테스트: 오버레이는 LayoutShell 최상위 div에서 <Outlet/>과 형제로
 * 렌더되므로(라우트 트리 안에 있지 않다), 배경 라우트가 바뀌어도 오버레이 자신은 언마운트되지
 * 않아야 한다. 만약 누군가 실수로 ChatOverlayPanel을 라우트 트리 내부(Outlet 하위)로 옮기면
 * 라우트 전환마다 재마운트되어 connectChatStomp가 다시 호출되거나 오버레이 상태(store)가
 * 새로 생기는 것처럼 보일 위험이 있다 — 이를 실제 react-router MemoryRouter로 재현해 검증한다.
 */
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
    // 오버레이 상태(zustand)는 라우트 전환과 무관하게 유지된다.
    expect(useChatOverlayStore.getState().isOpen).toBe(true)
    expect(useChatOverlayStore.getState().selectedRoomId).toBe(42)
    // 오버레이 컴포넌트 자체가 재마운트되지 않았다면 connect/disconnect가 추가로 호출되지 않는다.
    expect(connectChatStomp).toHaveBeenCalledTimes(1)
    expect(disconnectChatStomp).not.toHaveBeenCalled()
    unmount()
  })
})
