import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ChatRoomListItem } from '../model/chatRoom'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatRoomListPanel } from './ChatRoomListPanel'

/**
 * ChatRoomListPanel(구 ChatRoomListPage) 라우팅 관련 부분 회귀 검증(팝업 창 → 인앱 오버레이
 * 전환). 조회/필터/즐겨찾기 렌더 로직 자체는 기존과 동일해 재검증하지 않고, 방 클릭 시
 * `useNavigate` 대신 `chatOverlayStore.selectRoom`이 호출되는지만 확인한다.
 *
 * ChatRoomListPanel은 CreateChatRoomDialog(닫힌 상태라도 useMeQuery를 항상 호출)를 자식으로 항상
 * 마운트하므로, GET /api/employees/me도 함께 흘려보낸다(닫힌 Dialog는 Radix가 content를
 * 언마운트해 EmployeePicker의 DEPTS/DEPT_MEMBERS 조회까지는 발생하지 않는다).
 */

function chatRoom(
  chatRoomId: number,
  roomName: string,
  overrides?: Partial<ChatRoomListItem>,
): ChatRoomListItem {
  return {
    chatRoomId,
    roomName,
    lastMessageContent: '마지막 메시지',
    lastMessagedAt: '2026-06-24T10:30:00',
    unreadMessageCount: 0,
    isGroup: true,
    isPastRoom: false,
    isBookmarked: false,
    joinedMemberCount: 3,
    ...overrides,
  }
}

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

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function mockChatRoomsAndMe(rooms: ChatRoomListItem[]) {
  server.use(
    http.get(`${BASE_URL}/api/chat/rooms`, () => HttpResponse.json(rooms)),
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())),
  )
}

describe('ChatRoomListPanel', () => {
  it('방 클릭 시 useNavigate가 아니라 chatOverlayStore.selectRoom(chatRoomId)이 호출된다', async () => {
    mockChatRoomsAndMe([chatRoom(7, '업무방')])
    useChatOverlayStore.setState({ isOpen: false, selectedRoomId: null })
    render(<ChatRoomListPanel />, { wrapper: createWrapper() })

    const roomButton = await screen.findByRole('button', { name: '업무방' })
    const user = userEvent.setup()
    await user.click(roomButton)

    expect(useChatOverlayStore.getState().selectedRoomId).toBe(7)
    // selectRoom은 오버레이가 닫혀 있었다면 함께 연다(chatOverlayStore 계약).
    expect(useChatOverlayStore.getState().isOpen).toBe(true)
  })

  it('서로 다른 방을 클릭하면 selectedRoomId가 마지막 클릭한 방으로 교체된다', async () => {
    mockChatRoomsAndMe([chatRoom(1, '첫번째방'), chatRoom(2, '두번째방')])
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: null })
    render(<ChatRoomListPanel />, { wrapper: createWrapper() })

    await waitFor(() => expect(screen.getByRole('button', { name: '첫번째방' })).toBeInTheDocument())
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '두번째방' }))

    expect(useChatOverlayStore.getState().selectedRoomId).toBe(2)
  })

  it('isPastRoom 기준으로 최근/오래된 그룹을 나누고, 오래된 방이 있을 때만 구분선을 렌더한다', async () => {
    mockChatRoomsAndMe([
      chatRoom(1, '최근방', { isPastRoom: false }),
      chatRoom(2, '오래된방', { isPastRoom: true }),
    ])
    render(<ChatRoomListPanel />, { wrapper: createWrapper() })

    expect(await screen.findByRole('button', { name: '최근방' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '오래된방' })).toBeInTheDocument()
    expect(screen.getByText('오래된 채팅방')).toBeInTheDocument()
  })

  it('즐겨찾기한 방을 먼저, 그다음 lastMessagedAt 최신순으로 정렬한다', async () => {
    mockChatRoomsAndMe([
      chatRoom(1, '오래된메시지-비즐겨찾기', {
        isBookmarked: false,
        lastMessagedAt: '2026-01-01T00:00:00',
      }),
      chatRoom(2, '최신메시지-즐겨찾기', {
        isBookmarked: true,
        lastMessagedAt: '2026-06-01T00:00:00',
      }),
      chatRoom(3, '최신메시지-비즐겨찾기', {
        isBookmarked: false,
        lastMessagedAt: '2026-07-01T00:00:00',
      }),
      chatRoom(4, '오래된메시지-즐겨찾기', {
        isBookmarked: true,
        lastMessagedAt: '2026-02-01T00:00:00',
      }),
    ])
    render(<ChatRoomListPanel />, { wrapper: createWrapper() })

    await screen.findByRole('button', { name: '최신메시지-즐겨찾기' })
    const order = screen
      .getAllByRole('button')
      .map((el) => el.getAttribute('aria-label'))
      .filter((label): label is string => label != null && label.includes('메시지'))

    // 즐겨찾기(2, 4)가 비즐겨찾기(1, 3)보다 먼저, 각 그룹 안에서는 lastMessagedAt 최신순이다.
    expect(order).toEqual([
      '최신메시지-즐겨찾기',
      '오래된메시지-즐겨찾기',
      '최신메시지-비즐겨찾기',
      '오래된메시지-비즐겨찾기',
    ])
  })

  it('오래된 방이 없으면 구분선을 렌더하지 않는다', async () => {
    mockChatRoomsAndMe([chatRoom(1, '최근방', { isPastRoom: false })])
    render(<ChatRoomListPanel />, { wrapper: createWrapper() })

    expect(await screen.findByRole('button', { name: '최근방' })).toBeInTheDocument()
    expect(screen.queryByText('오래된 채팅방')).not.toBeInTheDocument()
  })

  it('우클릭 컨텍스트 메뉴의 "방나가기" 선택 시 해당 roomId로 LeaveChatRoomDialog가 열려 나가기 API를 그 방으로 호출한다', async () => {
    mockChatRoomsAndMe([chatRoom(1, '첫번째방'), chatRoom(2, '두번째방')])
    let leaveRequestedRoomId: string | undefined
    server.use(
      http.patch(`${BASE_URL}/api/chat/rooms/:roomId/leave`, ({ params }) => {
        leaveRequestedRoomId = params.roomId as string
        return new HttpResponse(null, { status: 204 })
      }),
    )
    render(<ChatRoomListPanel />, { wrapper: createWrapper() })
    const secondRoomButton = await screen.findByRole('button', { name: '두번째방' })
    const user = userEvent.setup()

    fireEvent.contextMenu(secondRoomButton)
    await user.click(await screen.findByRole('menuitem', { name: '방나가기' }))
    expect(await screen.findByText('채팅방에서 나가시겠습니까?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '나가기' }))

    await waitFor(() => expect(leaveRequestedRoomId).toBe('2'))
  })

  it('우클릭 컨텍스트 메뉴의 "채팅방 이름변경" 선택 시 해당 roomId의 현재 표시명이 프리필된 ChatRoomNameUpdateDialog가 열린다', async () => {
    mockChatRoomsAndMe([chatRoom(1, '첫번째방'), chatRoom(2, '두번째방')])
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms/2`, () =>
        HttpResponse.json({
          roomId: 2,
          roomName: '두번째방-상세표시명',
          isGroup: true,
          lastReadMessageId: null,
          members: [],
        }),
      ),
    )
    render(<ChatRoomListPanel />, { wrapper: createWrapper() })
    const secondRoomButton = await screen.findByRole('button', { name: '두번째방' })
    const user = userEvent.setup()

    fireEvent.contextMenu(secondRoomButton)
    await user.click(await screen.findByRole('menuitem', { name: '채팅방 이름변경' }))
    expect(await screen.findByText('표시명 수정')).toBeInTheDocument()

    // roomId=2로 확정된 useChatRoomDetailQuery(roomId) 조회 결과로 입력값이 프리필된다.
    await waitFor(() =>
      expect(screen.getByLabelText('표시명 *')).toHaveValue('두번째방-상세표시명'),
    )
  })
})
