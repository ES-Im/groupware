import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ChatRoomListItem } from '../model/chatRoom'
import { useChatRoomsQuery } from './useChatRoomsQuery'

/**
 * useChatRoomsQuery(ROADMAP(CHAT) T1.1) 실동작 검증.
 *
 * - 응답이 plain array(Page 아님)일 때 배열 그대로 반환되어야 한다(response-body.adoc 실측).
 * - keyword/isBookmark 쿼리 파라미터가 요청에 그대로 반영되어야 한다.
 * - isBookmark 변경 시 keepPreviousData로 이전 목록을 유지해, 화면이 매번
 *   "불러오는 중..."으로 전면 교체(깜빡임)되지 않아야 한다.
 */

function chatRoom(chatRoomId: number, roomName: string, isBookmarked: boolean): ChatRoomListItem {
  return {
    chatRoomId,
    roomName,
    lastMessageContent: '마지막 메시지',
    lastMessagedAt: '2026-06-24T10:30:00',
    unreadMessageCount: 2,
    isGroup: true,
    isPastRoom: false,
    isBookmarked,
    joinedMemberCount: 3,
    participantNames: [],
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useChatRoomsQuery', () => {
  it('plain array 응답을 Page 매핑 없이 그대로 반환한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([chatRoom(3, '업무방', true)]),
      ),
    )

    const { result } = renderHook(() => useChatRoomsQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data).toEqual([chatRoom(3, '업무방', true)])
  })

  it('keyword/isBookmark 쿼리 파라미터를 요청에 그대로 반영한다', async () => {
    let receivedKeyword: string | null = null
    let receivedIsBookmark: string | null = null
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, ({ request }) => {
        const url = new URL(request.url)
        receivedKeyword = url.searchParams.get('keyword')
        receivedIsBookmark = url.searchParams.get('isBookmark')
        return HttpResponse.json([])
      }),
    )

    const { result } = renderHook(
      () => useChatRoomsQuery({ keyword: '업무', isBookmark: true }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(receivedKeyword).toBe('업무')
    expect(receivedIsBookmark).toBe('true')
  })

  it('isBookmark 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, ({ request }) => {
        const url = new URL(request.url)
        const isBookmark = url.searchParams.get('isBookmark')
        if (isBookmark === 'true') {
          return HttpResponse.json([chatRoom(2, '즐겨찾기방', true)])
        }
        return HttpResponse.json([chatRoom(1, '전체방', false)])
      }),
    )

    const { result, rerender } = renderHook(
      ({ isBookmark }: { isBookmark?: boolean }) => useChatRoomsQuery({ isBookmark }),
      { wrapper: createWrapper(), initialProps: { isBookmark: undefined } },
    )

    await waitFor(() => expect(result.current.data?.[0]?.roomName).toBe('전체방'))
    expect(result.current.isLoading).toBe(false)

    rerender({ isBookmark: true })

    // keepPreviousData가 적용되면 새 데이터가 도착하기 전에도 isLoading은 false로 유지되고
    // (isFetching만 true), 화면에 표시되는 data는 새 응답이 오기 전까지 이전 값을 유지한다.
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.[0]?.roomName).toBe('전체방')

    await waitFor(() => expect(result.current.data?.[0]?.roomName).toBe('즐겨찾기방'))
    expect(result.current.isPlaceholderData).toBe(false)
  })
})
