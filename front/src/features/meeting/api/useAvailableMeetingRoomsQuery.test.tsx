import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useAvailableMeetingRoomsQuery } from './useAvailableMeetingRoomsQuery'

/**
 * useAvailableMeetingRoomsQuery(F802, ROADMAP T3.1) 실동작 검증.
 * date/startAt/endAt/capacity 4개 필수값이 전부 채워지기 전에는 enabled:false로 조회를 지연한다.
 */
function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

const EMPTY_PAGE = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  numberOfElements: 0,
  first: true,
  last: true,
  empty: true,
}

describe('useAvailableMeetingRoomsQuery', () => {
  it('4개 필수 파라미터가 전부 채워지기 전에는 조회하지 않는다(enabled:false)', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useAvailableMeetingRoomsQuery({ date: '2026-07-10', startAt: '10:00' }),
      { wrapper: Wrapper },
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('capacity가 0이어도(falsy값이지만 유효) 조회를 시도한다', async () => {
    let capacityRequested: string | null = null
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, ({ request }) => {
        capacityRequested = new URL(request.url).searchParams.get('capacity')
        return HttpResponse.json(EMPTY_PAGE)
      }),
    )

    const { Wrapper } = createWrapper()
    renderHook(
      () => useAvailableMeetingRoomsQuery({ date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 0 }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(capacityRequested).toBe('0'))
  })

  it('4개 필수 파라미터가 모두 채워지면 조회하고 응답을 그대로 노출한다', async () => {
    const page = {
      ...EMPTY_PAGE,
      content: [{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }],
      totalElements: 1,
      empty: false,
    }
    server.use(http.get(`${BASE_URL}/api/meeting-rooms/available`, () => HttpResponse.json(page)))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useAvailableMeetingRoomsQuery({ date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 4 }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.content).toHaveLength(1)
  })
})
