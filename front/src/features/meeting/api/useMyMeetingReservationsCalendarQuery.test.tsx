import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useMyMeetingReservationsCalendarQuery } from './useMyMeetingReservationsCalendarQuery'

function makeItem(meetingId: number, title: string) {
  return {
    meetingId,
    meetingRoomId: 3,
    meetingRoomName: '대회의실',
    reserverId: 1,
    reserverDeptName: '개발팀',
    reserverEmpName: '홍길동',
    title,
    meetingDate: '2026-06-19',
    startAt: '10:00:00',
    endAt: '11:00:00',
    isCanceled: false,
    participantCount: 2,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useMyMeetingReservationsCalendarQuery', () => {
  it('meetingKeys.myReservationsCalendar(range)로 캐시되고 응답 배열이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/my/reservations/calendar`, () =>
        HttpResponse.json([makeItem(10, '주간 회의')]),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const range = { start: '2026-06-01T00:00:00', end: '2026-06-30T23:59:59' }
    const { result } = renderHook(() => useMyMeetingReservationsCalendarQuery(range), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.[0].title).toBe('주간 회의')

    const cached = queryClient.getQueryData(meetingKeys.myReservationsCalendar(range))
    expect(cached).toEqual(result.current.data)
  })

  it('range가 바뀌면 새 start/end 쿼리스트링으로 재조회된다', async () => {
    const requestedRanges: Array<{ start: string | null; end: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/meetings/my/reservations/calendar`, ({ request }) => {
        const url = new URL(request.url)
        requestedRanges.push({ start: url.searchParams.get('start'), end: url.searchParams.get('end') })
        return HttpResponse.json([])
      }),
    )

    const { Wrapper } = createWrapper()
    const { rerender } = renderHook(
      ({ range }: { range?: { start?: string; end?: string } }) =>
        useMyMeetingReservationsCalendarQuery(range),
      {
        wrapper: Wrapper,
        initialProps: { range: { start: '2026-06-01T00:00:00', end: '2026-06-30T23:59:59' } },
      },
    )

    await waitFor(() => expect(requestedRanges).toHaveLength(1))
    expect(requestedRanges[0]).toEqual({ start: '2026-06-01T00:00:00', end: '2026-06-30T23:59:59' })

    rerender({ range: { start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' } })

    await waitFor(() => expect(requestedRanges).toHaveLength(2))
    expect(requestedRanges[1]).toEqual({ start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' })
  })
})
