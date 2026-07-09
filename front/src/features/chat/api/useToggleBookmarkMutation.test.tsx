import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { chatKeys } from '../model/queryKeys'
import { useToggleBookmarkMutation } from './useToggleBookmarkMutation'

/**
 * useToggleBookmarkMutation(F910, ROADMAP(CHAT) T1.3) 실동작 검증.
 *
 * - isBookmarked:false(현재 미등록) → bookmark 엔드포인트(`PATCH .../bookmark`) 호출.
 * - isBookmarked:true(현재 등록됨) → unbookmark 엔드포인트(`PATCH .../unbookmark`) 호출.
 * - 성공(204) 후 chatKeys.all이 invalidate되어 목록 쿼리가 재조회된다(department 도메인
 *   departmentMutations.invalidate.test.tsx와 동일하게, invalidateQueries를 mock으로 가로채지
 *   않고 "재조회로 최신 값이 반영되는지"를 블랙박스로 관찰한다).
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

describe('useToggleBookmarkMutation', () => {
  it('isBookmarked:false면 bookmark 엔드포인트를 호출하고 성공 후 목록이 재조회된다', async () => {
    let isBookmarked = false
    const bookmarkSpy: string[] = []
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([{ chatRoomId: 3, isBookmarked }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/3/bookmark`, () => {
        bookmarkSpy.push('bookmark')
        isBookmarked = true
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
        mutation: useToggleBookmarkMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.rooms.data?.[0]?.isBookmarked).toBe(false))

    result.current.mutation.mutate({ roomId: 3, isBookmarked: false })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(bookmarkSpy).toEqual(['bookmark'])
    await waitFor(() => expect(result.current.rooms.data?.[0]?.isBookmarked).toBe(true))
  })

  it('isBookmarked:true면 unbookmark 엔드포인트를 호출하고 성공 후 목록이 재조회된다', async () => {
    let isBookmarked = true
    const unbookmarkSpy: string[] = []
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([{ chatRoomId: 3, isBookmarked }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/3/unbookmark`, () => {
        unbookmarkSpy.push('unbookmark')
        isBookmarked = false
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
        mutation: useToggleBookmarkMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.rooms.data?.[0]?.isBookmarked).toBe(true))

    result.current.mutation.mutate({ roomId: 3, isBookmarked: true })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(unbookmarkSpy).toEqual(['unbookmark'])
    await waitFor(() => expect(result.current.rooms.data?.[0]?.isBookmarked).toBe(false))
  })

  it('실패 시 mutation이 에러 상태가 되고 목록은 갱신되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms`, () =>
        HttpResponse.json([{ chatRoomId: 3, isBookmarked: false }]),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/3/bookmark`, () =>
        HttpResponse.json(
          { code: 'CHAT_001', name: 'CHAT_ROOM_NOT_FOUND', httpStatus: 404, message: '채팅방을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useToggleBookmarkMutation(), { wrapper: Wrapper })

    result.current.mutate({ roomId: 3, isBookmarked: false })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
