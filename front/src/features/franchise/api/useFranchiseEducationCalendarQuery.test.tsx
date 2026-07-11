import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseEducationCalendarQuery } from './useFranchiseEducationCalendarQuery'

/**
 * useFranchiseEducationCalendarQuery(FRANCHISE_EDUCATION_CALENDAR, ROADMAP(FRANCHISE) T4.1)
 * 실동작 검증(useMyMeetingReservationsCalendarQuery.test.tsx 동형).
 *
 * - franchiseKeys.education.calendar(start, end)로 캐시되는지.
 * - start/end 미전달(최초 마운트) 시 쿼리스트링 자체가 생략되는지.
 * - range가 바뀌면 queryKey가 달라져 새 start/end로 자동 재조회되는지.
 */
function makeItem(id: number, title: string) {
  return {
    id,
    date: '2026-07-01',
    place: '교육장',
    title,
    isFull: false,
    isActive: true,
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

describe('useFranchiseEducationCalendarQuery', () => {
  it('franchiseKeys.education.calendar(start, end)로 캐시되고 응답 배열이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () =>
        HttpResponse.json([makeItem(1, '위생 교육')]),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const start = '2026-07-01T00:00:00'
    const end = '2026-08-01T00:00:00'
    const { result } = renderHook(() => useFranchiseEducationCalendarQuery(start, end), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.[0].title).toBe('위생 교육')

    const cached = queryClient.getQueryData(franchiseKeys.education.calendar(start, end))
    expect(cached).toEqual(result.current.data)
  })

  it('start/end 미전달 시 쿼리스트링 없이 요청된다(서버 당월 기본값 위임)', async () => {
    const requestedUrls: string[] = []
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, ({ request }) => {
        requestedUrls.push(request.url)
        return HttpResponse.json([])
      }),
    )

    const { Wrapper } = createWrapper()
    renderHook(() => useFranchiseEducationCalendarQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(requestedUrls).toHaveLength(1))
    const url = new URL(requestedUrls[0])
    expect(url.searchParams.has('start')).toBe(false)
    expect(url.searchParams.has('end')).toBe(false)
  })

  it('range가 바뀌면 새 start/end 쿼리스트링으로 재조회된다', async () => {
    const requestedRanges: Array<{ start: string | null; end: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, ({ request }) => {
        const url = new URL(request.url)
        requestedRanges.push({
          start: url.searchParams.get('start'),
          end: url.searchParams.get('end'),
        })
        return HttpResponse.json([])
      }),
    )

    const { Wrapper } = createWrapper()
    const { rerender } = renderHook(
      ({ start, end }: { start?: string; end?: string }) =>
        useFranchiseEducationCalendarQuery(start, end),
      {
        wrapper: Wrapper,
        initialProps: { start: '2026-07-01T00:00:00', end: '2026-08-01T00:00:00' },
      },
    )

    await waitFor(() => expect(requestedRanges).toHaveLength(1))
    expect(requestedRanges[0]).toEqual({ start: '2026-07-01T00:00:00', end: '2026-08-01T00:00:00' })

    rerender({ start: '2026-08-01T00:00:00', end: '2026-09-01T00:00:00' })

    await waitFor(() => expect(requestedRanges).toHaveLength(2))
    expect(requestedRanges[1]).toEqual({ start: '2026-08-01T00:00:00', end: '2026-09-01T00:00:00' })
  })
})
