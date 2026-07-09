import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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

function chatRoom(chatRoomId: number, roomName: string): ChatRoomListItem {
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
})
