import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useMeetingRoomReservationsCalendarQuery } from './useMeetingRoomReservationsCalendarQuery'

/**
 * useMeetingRoomReservationsCalendarQuery(F809, ROADMAP T2.3) 실동작 검증.
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

describe('useMeetingRoomReservationsCalendarQuery', () => {
  it('meetingRoomId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomReservationsCalendarQuery(undefined), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('meetingRoomId 확정 시 meetingKeys.roomReservationsCalendar(id, range)로 캐시된다', async () => {
    const items = [
      { reserverDeptName: '개발팀', reserverEmpName: '홍길동', participantCount: 2, meetingDate: '2026-07-10', startAt: '10:00:00', endAt: '11:00:00' },
    ]
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, () => HttpResponse.json(items)),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomReservationsCalendarQuery(3), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual(items)

    const cached = queryClient.getQueryData(meetingKeys.roomReservationsCalendar(3, undefined))
    expect(cached).toEqual(items)
  })

  it('range가 바뀌면 새 start/end 쿼리스트링으로 재조회된다', async () => {
    const requestedRanges: Array<{ start: string | null; end: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, ({ request }) => {
        const url = new URL(request.url)
        requestedRanges.push({ start: url.searchParams.get('start'), end: url.searchParams.get('end') })
        return HttpResponse.json([])
      }),
    )

    const { Wrapper } = createWrapper()
    const { rerender } = renderHook(
      ({ range }: { range?: { start?: string; end?: string } }) =>
        useMeetingRoomReservationsCalendarQuery(3, range),
      {
        wrapper: Wrapper,
        initialProps: { range: { start: '2026-06-01T00:00:00', end: '2026-06-30T23:59:59' } },
      },
    )

    await waitFor(() => expect(requestedRanges).toHaveLength(1))

    rerender({ range: { start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' } })

    await waitFor(() => expect(requestedRanges).toHaveLength(2))
    expect(requestedRanges[1]).toEqual({ start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' })
  })
})
