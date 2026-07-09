import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { chatKeys } from '../model/queryKeys'
import { useLeaveChatRoomMutation } from './useLeaveChatRoomMutation'

/**
 * useLeaveChatRoomMutation(F909, ROADMAP(CHAT) T4.4) 실동작 검증.
 *
 * - `PATCH /api/chat/rooms/{roomId}/leave`를 body 없이 호출한다(path-parameters.adoc 실측:
 *   roomId만 사용).
 * - 성공(204) 후 chatKeys.all이 invalidate되어 목록 쿼리가 재조회된다(useToggleBookmarkMutation.
 *   test.tsx와 동일하게 invalidateQueries를 mock으로 가로채지 않고 "재조회로 최신 값이
 *   반영되는지"를 블랙박스로 관찰한다) — 나간 방이 목록에서 사라지는 것으로 확인한다.
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

describe('useLeaveChatRoomMutation', () => {
  it('PATCH leave를 body 없이 호출하고 성공 후 목록이 재조회되어 나간 방이 사라진다', async () => {
    let hasLeft = false
    const requestBodies: unknown[] = []
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json(hasLeft ? [] : [{ chatRoomId: 3, roomName: '테스트방' }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/3/leave`, async ({ request }) => {
        requestBodies.push(await request.text())
        hasLeft = true
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
        mutation: useLeaveChatRoomMutation(3),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.rooms.data).toHaveLength(1))

    result.current.mutation.mutate()

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(requestBodies).toEqual([''])
    await waitFor(() => expect(result.current.rooms.data).toHaveLength(0))
  })

  it('실패 시 mutation이 에러 상태가 되고 목록은 갱신되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([{ chatRoomId: 3, roomName: '테스트방' }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/3/leave`, () =>
        HttpResponse.json(
          { code: 'CHAT_001', name: 'CHAT_ROOM_NOT_FOUND', httpStatus: 404, message: '채팅방을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useLeaveChatRoomMutation(3), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
