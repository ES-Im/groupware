import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ChatRoomDetail } from '../model/chatRoomDetail'
import { useChatRoomDetailQuery } from './useChatRoomDetailQuery'

function chatRoomDetail(): ChatRoomDetail {
  return {
    roomId: 3,
    roomName: '업무방',
    isGroup: true,
    lastReadMessageId: 99,
    members: [
      { memberId: 1, deptName: '개발팀', memberName: '홍길동', profileImageUrl: '/api/employees/1/files/7/preview' },
      { memberId: 2, deptName: '기획팀', memberName: '김영희', profileImageUrl: null },
    ],
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useChatRoomDetailQuery', () => {
  it('roomId로 채팅방 상세(멤버 포함)를 조회해 그대로 반환한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms/3`, () => HttpResponse.json(chatRoomDetail())),
    )

    const { result } = renderHook(() => useChatRoomDetailQuery(3), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual(chatRoomDetail())
  })

  it('roomId가 undefined이면 요청을 보내지 않는다(enabled:false)', async () => {
    const handler = vi.fn(() => HttpResponse.json(chatRoomDetail()))
    server.use(http.get(`${BASE_URL}/api/chat/rooms/3`, handler))

    const { result } = renderHook(() => useChatRoomDetailQuery(undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(handler).not.toHaveBeenCalled()
  })
})
