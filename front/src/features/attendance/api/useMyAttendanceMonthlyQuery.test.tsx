import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { attendanceKeys } from '../model/queryKeys'
import { useMyAttendanceMonthlyQuery } from './useMyAttendanceMonthlyQuery'

/**
 * useMyAttendanceMonthlyQuery(F303, ROADMAP T1.4) 실동작 검증.
 *
 * - attendanceKeys.myMonthly(params)로 캐시되는지(QueryClient.getQueryData로 확인).
 * - Spring Page 메타(number 0-based 등)가 변환 없이 그대로 노출되는지.
 * - status/page 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시
 *   true가 되지 않는지(department useDepartmentsQuery.test.tsx와 동일 패턴).
 */

function makeItem(attendanceId: number, status: string) {
  return {
    attendanceId,
    attendanceStatus: status,
    attendanceDate: '2026-07-01',
    startAt: '2026-07-01T09:00:00',
    endAt: '2026-07-01T18:00:00',
    isApproved: true,
    draftId: null,
  }
}

function makePage(items: unknown[], page: number) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: page,
    size: 10,
    first: page === 0,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
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

describe('useMyAttendanceMonthlyQuery', () => {
  it('attendanceKeys.myMonthly(params)로 캐시되고, Page 메타가 변환 없이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () =>
        HttpResponse.json(makePage([makeItem(1, 'NORMAL')], 0)),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { yearMonth: '2026-07', page: 0, size: 10 }
    const { result } = renderHook(() => useMyAttendanceMonthlyQuery(params), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    // Page 메타는 파싱 단계에서 변환하지 않고 그대로 노출되어야 한다(0-based number 등).
    expect(result.current.data?.number).toBe(0)
    expect(result.current.data?.size).toBe(10)
    expect(result.current.data?.totalElements).toBe(1)
    expect(result.current.data?.content[0].attendanceStatus).toBe('NORMAL')

    const cached = queryClient.getQueryData(attendanceKeys.myMonthly(params))
    expect(cached).toEqual(result.current.data)
  })

  it('status 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        if (status === 'ABSENT') {
          return HttpResponse.json(makePage([makeItem(2, 'ABSENT')], 0))
        }
        return HttpResponse.json(makePage([makeItem(1, 'NORMAL')], 0))
      }),
    )

    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      ({ status }: { status?: 'NORMAL' | 'ABSENT' }) => useMyAttendanceMonthlyQuery({ status }),
      { wrapper: Wrapper, initialProps: { status: undefined } },
    )

    await waitFor(() => expect(result.current.data?.content[0].attendanceStatus).toBe('NORMAL'))
    expect(result.current.isLoading).toBe(false)

    rerender({ status: 'ABSENT' })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].attendanceStatus).toBe('NORMAL')

    await waitFor(() =>
      expect(result.current.data?.content[0].attendanceStatus).toBe('ABSENT'),
    )
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('쿼리스트링이 없는 요청도 정상 처리한다(params 미지정)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.toString()).toBe('')
        return HttpResponse.json(makePage([], 0))
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMyAttendanceMonthlyQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.empty).toBe(true)
  })
})
