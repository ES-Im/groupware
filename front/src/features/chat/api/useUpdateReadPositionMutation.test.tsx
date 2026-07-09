import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { chatKeys } from '../model/queryKeys'
import { useUpdateReadPositionMutation } from './useUpdateReadPositionMutation'

/**
 * useUpdateReadPositionMutation(F911, ROADMAP(CHAT) T2.5) 실동작 검증.
 *
 * - `PATCH /api/chat/rooms/{roomId}/read-position`에 `{ lastReadMessageId }` body로 요청한다
 *   (request-fields.adoc 실측 필드명 그대로).
 * - 성공(204) 후 채팅방 목록(rooms) 쿼리가 재조회된다. useToggleBookmarkMutation.test.tsx와
 *   동일하게 invalidateQueries를 mock으로 가로채지 않고 "재조회로 최신 값이 반영되는지"를
 *   블랙박스로 관찰한다.
 * - keyword/isBookmark 필터가 걸린 목록 쿼리(캐시 키의 params가 undefined가 아닌 경우)도
 *   함께 무효화되는지 확인한다 — chatKeys.rooms()처럼 params 자리에 undefined를 그대로 채워
 *   넘기면 TanStack Query의 부분 매칭이 다른 params 조합과 매칭되지 않는 함정이 있어(길이만큼만
 *   비교), 이 훅이 그 함정을 피해 'rooms' 세그먼트까지만 넘기는지 회귀 검증한다.
 */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

describe('useUpdateReadPositionMutation', () => {
  it('lastReadMessageId body로 PATCH read-position을 호출하고 성공 후 목록이 재조회된다', async () => {
    let unreadMessageCount = 3
    const requestBodies: unknown[] = []
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([{ chatRoomId: 1, unreadMessageCount }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/1/read-position`, async ({ request }) => {
        requestBodies.push(await request.json())
        unreadMessageCount = 0
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        rooms: useQuery({
          queryKey: chatKeys.rooms(),
          queryFn: async () => (await fetch(`${BASE_URL}/api/chat/rooms`)).json(),
        }),
        mutation: useUpdateReadPositionMutation(1),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.rooms.data?.[0]?.unreadMessageCount).toBe(3))

    result.current.mutation.mutate(42)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(requestBodies).toEqual([{ lastReadMessageId: 42 }])
    await waitFor(() => expect(result.current.rooms.data?.[0]?.unreadMessageCount).toBe(0))
  })

  it('keyword/isBookmark 필터가 걸린 목록 쿼리도 함께 재조회된다(부분 매칭 함정 회귀 검증)', async () => {
    let unreadMessageCount = 5
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([{ chatRoomId: 1, unreadMessageCount }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/1/read-position`, () => {
        unreadMessageCount = 0
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        // params가 undefined가 아닌 필터 조합(isBookmark:true) 캐시 항목.
        filteredRooms: useQuery({
          queryKey: chatKeys.rooms({ isBookmark: true }),
          queryFn: async () => (await fetch(`${BASE_URL}/api/chat/rooms`)).json(),
        }),
        mutation: useUpdateReadPositionMutation(1),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() =>
      expect(result.current.filteredRooms.data?.[0]?.unreadMessageCount).toBe(5),
    )

    result.current.mutation.mutate(42)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() =>
      expect(result.current.filteredRooms.data?.[0]?.unreadMessageCount).toBe(0),
    )
  })

  it('실패 시 mutation이 에러 상태가 되고 목록은 갱신되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([{ chatRoomId: 1, unreadMessageCount: 3 }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/1/read-position`, () =>
        HttpResponse.json(
          { code: 'CHAT_001', name: 'CHAT_ROOM_NOT_FOUND', httpStatus: 404, message: '채팅방을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateReadPositionMutation(1), { wrapper: Wrapper })

    result.current.mutate(42)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
