import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useMeetingRoomCreateMutation } from './useMeetingRoomCreateMutation'

/**
 * useMeetingRoomCreateMutation(F812, ROADMAP(MEETING-ROOMS) T6.2) 성공 후 invalidate 검증.
 * boardFileMutations.invalidate.test.tsx와 동일 관행: mock을 가로채지 않고 "성공 후 목록 쿼리가
 * 실제로 재조회되어 최신 값을 반영하는지"를 블랙박스로 확인한다.
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

function useRoomManagementQuery() {
  return useQuery({
    queryKey: meetingKeys.roomManagement({ page: 0, size: 10 }),
    queryFn: async () =>
      (await fetch(`${BASE_URL}/api/meeting-rooms/management?page=0&size=10`)).json(),
  })
}

describe('useMeetingRoomCreateMutation', () => {
  it('등록 성공(201) 시 회의실 관리 목록 쿼리가 invalidate되어 재조회된다', async () => {
    let rooms = [{ meetingRoomId: 1, name: '기존회의실', capacity: 4, isAvailable: true }]
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () =>
        HttpResponse.json({
          content: rooms,
          totalElements: rooms.length,
          totalPages: 1,
          number: 0,
          size: 10,
          numberOfElements: rooms.length,
          first: true,
          last: true,
          empty: rooms.length === 0,
        }),
      ),
      http.post(`${BASE_URL}/api/meeting-rooms`, async () => {
        rooms = [...rooms, { meetingRoomId: 2, name: '신규회의실', capacity: 6, isAvailable: true }]
        return HttpResponse.json({ meetingRoomId: 2 }, { status: 201 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ list: useRoomManagementQuery(), mutation: useMeetingRoomCreateMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content).toHaveLength(1))

    result.current.mutation.mutate({ name: '신규회의실', description: '설명', capacity: 6 })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content).toHaveLength(2))
  })

  it('서버 판정 실패는 삼켜지지 않고 mutation error로 반영된다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/meeting-rooms`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 존재하는 회의실 이름입니다' },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useMeetingRoomCreateMutation(), { wrapper: Wrapper })

    result.current.mutate({ name: '중복회의실', description: '설명', capacity: 6 })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
