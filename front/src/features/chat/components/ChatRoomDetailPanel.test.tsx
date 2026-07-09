import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatRoomDetailPanel } from './ChatRoomDetailPanel'

/**
 * ChatRoomDetailPanel(구 ChatRoomDetailPage) 라우팅 관련 부분 회귀 검증(팝업 창 → 인앱 오버레이
 * 전환). 이제 roomId는 useParams가 아니라 오버레이 스토어(selectedRoomId)에서 나온 값을 그대로
 * prop으로 받는다 — 조회/메시지·읽음 위치 동기화 로직은 기존과 동일해 재검증하지 않고,
 * "목록으로" 뒤로가기 클릭 시 `useNavigate` 대신 `chatOverlayStore.backToList`가 호출되는지만
 * 확인한다.
 *
 * 렌더 경로에서 함께 마운트되는 ChatRoomSettingsMenu(무필터 CHAT_ROOM_LIST 재조회)·
 * ChatMessageInput(useMeQuery)까지 실제로 훅이 실행되므로, 그 하위 조회도 최소 목으로 흘려보낸다.
 * STOMP 연결 상태는 기본값 idle이라 useChatRoomSubscription은 구독을 시도하지 않는다(연결
 * 상태 검증은 stompClient.test.ts/useChatRoomSubscription.test.tsx가 이미 커버).
 */

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

function chatRoomDetail(roomId: number, roomName: string) {
  return {
    roomId,
    roomName,
    isGroup: false,
    lastReadMessageId: null,
    members: [{ memberId: 2, deptName: '개발팀', memberName: '김철수', profileImageUrl: null }],
  }
}

function mockDetailEndpoints(roomId: number, roomName: string) {
  server.use(
    http.get(`${BASE_URL}/api/chat/rooms/${roomId}`, () =>
      HttpResponse.json(chatRoomDetail(roomId, roomName)),
    ),
    http.get(`${BASE_URL}/api/chat/rooms/${roomId}/messages`, () =>
      HttpResponse.json({ messages: [], nextCursor: null, hasNext: false }),
    ),
    // ChatRoomSettingsMenu가 무필터로 재조회하는 목록(현재 방의 isBookmarked를 찾기 위함).
    http.get(`${BASE_URL}/api/chat/rooms`, () => HttpResponse.json([])),
    // ChatMessageInput → useSendChatMessage가 항상 호출하는 useMeQuery.
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())),
  )
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('ChatRoomDetailPanel', () => {
  it('"목록으로" 버튼 클릭 시 useNavigate가 아니라 chatOverlayStore.backToList가 호출된다', async () => {
    mockDetailEndpoints(5, '업무방')
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 5 })
    render(<ChatRoomDetailPanel roomId={5} />, { wrapper: createWrapper() })

    await screen.findByText('업무방')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '목록으로' }))

    // backToList는 selectedRoomId만 null로 되돌리고 isOpen은 건드리지 않는다(chatOverlayStore 계약).
    expect(useChatOverlayStore.getState().selectedRoomId).toBeNull()
    expect(useChatOverlayStore.getState().isOpen).toBe(true)
  })
})
