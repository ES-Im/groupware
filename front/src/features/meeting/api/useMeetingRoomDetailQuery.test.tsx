import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useMeetingRoomDetailQuery } from './useMeetingRoomDetailQuery'

/**
 * useMeetingRoomDetailQuery(F807, ROADMAP T2.1) 실동작 검증.
 * - meetingRoomId 미확정 시 enabled:false로 조회를 지연하는지.
 * - 확정 시 meetingKeys.roomDetail(meetingRoomId)로 캐시되는지.
 */
function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useMeetingRoomDetailQuery', () => {
  it('meetingRoomId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomDetailQuery(undefined), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('meetingRoomId 확정 시 meetingKeys.roomDetail(id)로 캐시되고 응답이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3`, () =>
        HttpResponse.json({ meetingRoomId: 3, name: '대회의실', description: '설명', capacity: 10, isAvailable: true }),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomDetailQuery(3), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.name).toBe('대회의실')

    const cached = queryClient.getQueryData(meetingKeys.roomDetail(3))
    expect(cached).toEqual(result.current.data)
  })
})
