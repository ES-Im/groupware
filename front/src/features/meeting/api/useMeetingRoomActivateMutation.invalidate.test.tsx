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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
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
