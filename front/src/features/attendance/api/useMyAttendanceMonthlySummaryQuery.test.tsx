import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { attendanceKeys } from '../model/queryKeys'
import { useMyAttendanceMonthlySummaryQuery } from './useMyAttendanceMonthlySummaryQuery'

/**
 * useMyAttendanceMonthlySummaryQuery(F304, ROADMAP T1.4) 실동작 검증.
 *
 * - attendanceKeys.mySummary(yearMonth)로 캐시되는지(QueryClient.getQueryData로 확인).
 * - 응답이 단일 객체 그대로 노출되는지(배열 아님).
 * - yearMonth 지정/미지정 두 케이스 모두 정상 조회되는지.
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

const SUMMARY = {
  approvedAttendanceCount: 15,
  pendingAttendanceCount: 3,
  totalAttendanceCount: 18,
  overtimeMinutes: 120,
}

describe('useMyAttendanceMonthlySummaryQuery', () => {
  it('yearMonth 지정 시 attendanceKeys.mySummary(yearMonth)로 캐시되고 단일 객체를 그대로 노출한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('yearMonth')).toBe('2026-07')
        return HttpResponse.json(SUMMARY)
      }),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useMyAttendanceMonthlySummaryQuery({ yearMonth: '2026-07' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(Array.isArray(result.current.data)).toBe(false)
    expect(result.current.data).toEqual(SUMMARY)

    const cached = queryClient.getQueryData(attendanceKeys.mySummary('2026-07'))
    expect(cached).toEqual(SUMMARY)
  })

  it('yearMonth 미지정 시 쿼리스트링 없이 요청하고 mySummary(undefined) 키로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.toString()).toBe('')
        return HttpResponse.json(SUMMARY)
      }),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useMyAttendanceMonthlySummaryQuery(), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual(SUMMARY)

    const cached = queryClient.getQueryData(attendanceKeys.mySummary(undefined))
    expect(cached).toEqual(SUMMARY)
  })
})
