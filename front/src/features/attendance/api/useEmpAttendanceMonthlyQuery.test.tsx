import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useEmpAttendanceMonthlyQuery } from './useEmpAttendanceMonthlyQuery'

function makeRow(empId: number, total: number) {
  return {
    empInfo: { empId, empNo: `20260700${empId}`, empName: `사원${empId}`, deptName: '본사', positionName: '사원' },
    summary: { totalAttendanceCount: total, pendingAttendanceCount: 0, approvedAttendanceCount: total, overtimeMinutes: 0 },
    attendanceInfo: [],
  }
}

function makePage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 100,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

describe('useEmpAttendanceMonthlyQuery', () => {
  it('deptId/empId가 모두 확정되고 enabled=true면 조회 후 empInfo.empId가 일치하는 행만 select한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('yearMonth')).toBe('2026-07')
        expect(url.searchParams.get('size')).toBe('100')
        return HttpResponse.json(makePage([makeRow(5, 3), makeRow(7, 12)]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpAttendanceMonthlyQuery(1, 7, '2026-07', true), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.empInfo.empId).toBe(7)
    expect(result.current.data?.summary.totalAttendanceCount).toBe(12)
  })

  it('enabled=false면 요청 자체가 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, () => {
        spy()
        return HttpResponse.json(makePage([]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpAttendanceMonthlyQuery(1, 7, '2026-07', false), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('deptId가 undefined면 enabled=true여도 요청이 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, () => {
        spy()
        return HttpResponse.json(makePage([]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpAttendanceMonthlyQuery(undefined, 7, '2026-07', true), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('empId가 undefined면 enabled=true여도 요청이 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, () => {
        spy()
        return HttpResponse.json(makePage([]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpAttendanceMonthlyQuery(1, undefined, '2026-07', true), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })
})
