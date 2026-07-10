import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { chatKeys } from '../model/queryKeys'
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

function chatRoomDetail(roomId: number, roomName: string, lastReadMessageId: number | null = null) {
  return {
    roomId,
    roomName,
    isGroup: false,
    lastReadMessageId,
    members: [{ memberId: 2, deptName: '개발팀', memberName: '김철수', profileImageUrl: null }],
  }
}

function mockDetailEndpoints(
  roomId: number,
  roomName: string,
  options?: { lastReadMessageId?: number | null; messages?: unknown[] },
) {
  server.use(
    http.get(`${BASE_URL}/api/chat/rooms/${roomId}`, () =>
      HttpResponse.json(chatRoomDetail(roomId, roomName, options?.lastReadMessageId ?? null)),
    ),
    http.get(`${BASE_URL}/api/chat/rooms/${roomId}/messages`, () =>
      HttpResponse.json({ messages: options?.messages ?? [], nextCursor: null, hasNext: false }),
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

    // backToList는 screen만 'home'으로 되돌리고 selectedRoomId·isOpen은 건드리지 않는다
    // (chatOverlayStore 계약 — 오버레이를 닫았다 다시 열면 마지막 보던 방으로 복귀해야 한다).
    expect(useChatOverlayStore.getState().screen).toBe('home')
    expect(useChatOverlayStore.getState().selectedRoomId).toBe(5)
    expect(useChatOverlayStore.getState().isOpen).toBe(true)
  })

  it('"멤버 초대" 버튼 클릭 시 chatOverlayStore.startInviteFlow(roomId)가 호출된다', async () => {
    mockDetailEndpoints(5, '업무방')
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 5, screen: 'room' })
    render(<ChatRoomDetailPanel roomId={5} />, { wrapper: createWrapper() })

    await screen.findByText('업무방')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '멤버 초대' }))

    // startInviteFlow는 홈 화면 사원목록 탭을 초대 모드로 연다(chatOverlayStore 계약).
    expect(useChatOverlayStore.getState().screen).toBe('home')
    expect(useChatOverlayStore.getState().activeTab).toBe('employees')
    expect(useChatOverlayStore.getState().inviteTargetRoomId).toBe(5)
  })

  it('본인이 보낸 메시지는 우측(bg-primary), 상대방 메시지는 좌측(bg-muted)으로 렌더된다', async () => {
    mockDetailEndpoints(5, '업무방', {
      lastReadMessageId: 100,
      messages: [
        {
          id: 101,
          senderId: 1,
          clientMessageId: 'c1',
          senderName: '홍길동',
          content: '내가 보낸 메시지',
          sentAt: '2026-07-10T10:00:00',
          profileImageUrl: null,
        },
        {
          id: 102,
          senderId: 2,
          clientMessageId: 'c2',
          senderName: '김철수',
          content: '상대방 메시지',
          sentAt: '2026-07-10T10:01:00',
          profileImageUrl: null,
        },
      ],
    })
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 5, screen: 'room' })
    render(<ChatRoomDetailPanel roomId={5} />, { wrapper: createWrapper() })

    const mine = await screen.findByText('내가 보낸 메시지')
    expect(mine).toHaveClass('bg-primary')

    const others = await screen.findByText('상대방 메시지')
    expect(others).toHaveClass('bg-muted')
  })

  it('lastReadMessageId보다 id가 큰 첫 메시지 앞에 "안 읽은 메시지 N개" 구분선이 렌더된다', async () => {
    mockDetailEndpoints(5, '업무방', {
      lastReadMessageId: 100,
      messages: [
        {
          id: 100,
          senderId: 2,
          clientMessageId: 'c0',
          senderName: '김철수',
          content: '읽은 메시지',
          sentAt: '2026-07-10T09:59:00',
          profileImageUrl: null,
        },
        {
          id: 101,
          senderId: 2,
          clientMessageId: 'c1',
          senderName: '김철수',
          content: '안읽은 메시지1',
          sentAt: '2026-07-10T10:00:00',
          profileImageUrl: null,
        },
        {
          id: 102,
          senderId: 2,
          clientMessageId: 'c2',
          senderName: '김철수',
          content: '안읽은 메시지2',
          sentAt: '2026-07-10T10:01:00',
          profileImageUrl: null,
        },
      ],
    })
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 5, screen: 'room' })
    render(<ChatRoomDetailPanel roomId={5} />, { wrapper: createWrapper() })

    await screen.findByText('읽은 메시지')
    expect(screen.getByText('안 읽은 메시지 2개')).toBeInTheDocument()
  })

  it('방에 머무는 동안 새 메시지가 도착해도 구분선 위치·개수는 방 입장 시점 값으로 고정된다', async () => {
    mockDetailEndpoints(5, '업무방', {
      lastReadMessageId: 100,
      messages: [
        {
          id: 100,
          senderId: 2,
          clientMessageId: 'c0',
          senderName: '김철수',
          content: '읽은 메시지',
          sentAt: '2026-07-10T09:59:00',
          profileImageUrl: null,
        },
        {
          id: 101,
          senderId: 2,
          clientMessageId: 'c1',
          senderName: '김철수',
          content: '안읽은 메시지1',
          sentAt: '2026-07-10T10:00:00',
          profileImageUrl: null,
        },
      ],
    })
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 5, screen: 'room' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <ChatRoomDetailPanel roomId={5} />
      </QueryClientProvider>,
    )

    await screen.findByText('읽은 메시지')
    expect(screen.getByText('안 읽은 메시지 1개')).toBeInTheDocument()

    // 실시간 수신을 흉내내 캐시에 새 메시지를 직접 추가한다(useChatRoomSubscription이 수신 시
    // upsertChatMessage로 하는 것과 동일한 setQueryData 패턴).
    act(() => {
      queryClient.setQueryData(
        chatKeys.messages(5),
        (old: { pages: { messages: unknown[] }[]; pageParams: unknown[] }) => ({
          ...old,
          pages: [
            {
              ...old.pages[0],
              messages: [
                ...old.pages[0].messages,
                {
                  id: 102,
                  senderId: 2,
                  clientMessageId: 'c2',
                  senderName: '김철수',
                  content: '실시간새메시지',
                  sentAt: '2026-07-10T10:02:00',
                  profileImageUrl: null,
                },
              ],
            },
            ...old.pages.slice(1),
          ],
        }),
      )
    })

    await screen.findByText('실시간새메시지')
    // 구분선은 여전히 방 입장 시점 값(1개)이어야 하며, 방문 중 도착한 메시지는 반영하지 않는다.
    expect(screen.getByText('안 읽은 메시지 1개')).toBeInTheDocument()
  })

  it('lastReadMessageId가 null이면(신규 참여 등) 구분선을 렌더하지 않는다', async () => {
    mockDetailEndpoints(5, '업무방', {
      lastReadMessageId: null,
      messages: [
        {
          id: 100,
          senderId: 2,
          clientMessageId: 'c0',
          senderName: '김철수',
          content: '첫 메시지',
          sentAt: '2026-07-10T09:59:00',
          profileImageUrl: null,
        },
      ],
    })
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 5, screen: 'room' })
    render(<ChatRoomDetailPanel roomId={5} />, { wrapper: createWrapper() })

    await screen.findByText('첫 메시지')
    expect(screen.queryByText(/안 읽은 메시지/)).not.toBeInTheDocument()
  })
})
