import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useMeetingRoomDetailQuery } from './useMeetingRoomDetailQuery'
import { useMeetingRoomManagementListQuery } from './useMeetingRoomManagementListQuery'
import { useMeetingRoomActivateMutation } from './useMeetingRoomActivateMutation'
import { useMeetingRoomDeactivateMutation } from './useMeetingRoomDeactivateMutation'

/**
 * useMeetingRoomActivateMutation/useMeetingRoomDeactivateMutation(F814, ROADMAP(MEETING-ROOMS)
 * T6.2) 성공 후 invalidate 검증.
 *
 * 오케스트레이터가 M7(상세 화면 재사용)을 위해 직접 명시한 규약: onSuccess에서
 * roomManagement(목록)와 roomDetail(상세) **둘 다** invalidate해야 한다. 목록만 갱신되고
 * 상세의 활성 상태가 stale해지는 회귀를 막기 위한 테스트다(boardFileMutations.invalidate.test.tsx와
 * 동일하게 mock을 가로채지 않고 재조회 결과를 블랙박스로 확인).
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

function mockRoomDetail(meetingRoomId: number, isAvailable: boolean) {
  return http.get(`${BASE_URL}/api/meeting-rooms/${meetingRoomId}`, () =>
    HttpResponse.json({ meetingRoomId, name: '대회의실', description: '설명', capacity: 10, isAvailable }),
  )
}

function mockRoomManagementList(isAvailable: boolean) {
  return http.get(`${BASE_URL}/api/meeting-rooms/management`, () =>
    HttpResponse.json({
      content: [{ meetingRoomId: 1, name: '대회의실', capacity: 10, isAvailable }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }),
  )
}

describe('useMeetingRoomActivateMutation - 이중 invalidate', () => {
  it('활성화 성공(204) 시 roomManagement 목록과 roomDetail 둘 다 invalidate되어 재조회된다', async () => {
    let isAvailable = false
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () => HttpResponse.json({
        content: [{ meetingRoomId: 1, name: '대회의실', capacity: 10, isAvailable }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false,
      })),
      http.get(`${BASE_URL}/api/meeting-rooms/1`, () =>
        HttpResponse.json({ meetingRoomId: 1, name: '대회의실', description: '설명', capacity: 10, isAvailable }),
      ),
      http.patch(`${BASE_URL}/api/meeting-rooms/1/activate`, () => {
        isAvailable = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        list: useMeetingRoomManagementListQuery({ page: 0, size: 10 }),
        detail: useMeetingRoomDetailQuery(1),
        mutation: useMeetingRoomActivateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content[0].isAvailable).toBe(false))
    await waitFor(() => expect(result.current.detail.data?.isAvailable).toBe(false))

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content[0].isAvailable).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.isAvailable).toBe(true))
  })

  it('비활성화 성공(204) 시 roomManagement 목록과 roomDetail 둘 다 invalidate되어 재조회된다', async () => {
    let isAvailable = true
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () => HttpResponse.json({
        content: [{ meetingRoomId: 1, name: '대회의실', capacity: 10, isAvailable }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false,
      })),
      http.get(`${BASE_URL}/api/meeting-rooms/1`, () =>
        HttpResponse.json({ meetingRoomId: 1, name: '대회의실', description: '설명', capacity: 10, isAvailable }),
      ),
      http.patch(`${BASE_URL}/api/meeting-rooms/1/deactivate`, () => {
        isAvailable = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        list: useMeetingRoomManagementListQuery({ page: 0, size: 10 }),
        detail: useMeetingRoomDetailQuery(1),
        mutation: useMeetingRoomDeactivateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content[0].isAvailable).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.isAvailable).toBe(true))

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content[0].isAvailable).toBe(false))
    await waitFor(() => expect(result.current.detail.data?.isAvailable).toBe(false))
  })
})
