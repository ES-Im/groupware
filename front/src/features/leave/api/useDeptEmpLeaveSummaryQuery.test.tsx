import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { leaveKeys } from '../model/leaveKeys'
import { useDeptEmpLeaveSummaryQuery } from './useDeptEmpLeaveSummaryQuery'

/**
 * useDeptEmpLeaveSummaryQuery(F745, ROADMAP(LEAVE) M4 T4.2) 실동작 검증.
 *
 * - deptId===undefined면 enabled:false로 대기해 요청 자체가 나가지 않는다.
 * - deptId가 확정된 number일 때 leaveKeys.deptSummary(deptId, params)로 캐시되고, empId를 포함한
 *   응답이 그대로 노출된다.
 */

function makeRow(empId: number, empName: string) {
  return {
    empId,
    empNo: `20260${empId}`,
    empName,
    deptName: 'IT',
    positionName: '사원',
    leaveSummary: {
      annualBaseGrantDays: 15.0,
      annualUsedDays: 2.0,
      specialGrantDays: 1.0,
      specialUsedDays: 0.5,
      compensatoryGrantDays: 3.0,
      compensatoryUsedDays: 1.0,
    },
  }
}

function makePage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
    numberOfElements: items.length,
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

describe('useDeptEmpLeaveSummaryQuery', () => {
  it('deptId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { result } = renderHook(() => useDeptEmpLeaveSummaryQuery(undefined), {
      wrapper: createWrapper().Wrapper,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('deptId가 확정된 number이면 조회되고 leaveKeys.deptSummary(deptId, params)로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments/1/employees/leaves/summary`, () =>
        HttpResponse.json(makePage([makeRow(2, '홍길동')])),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { year: 2026, page: 0, size: 10 }
    const { result } = renderHook(() => useDeptEmpLeaveSummaryQuery(1, params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].empId).toBe(2)

    const cached = queryClient.getQueryData(leaveKeys.deptSummary(1, params))
    expect(cached).toEqual(result.current.data)
  })
})

describe('useDeptLeaveUsageSummaryQuery', () => {
  it('deptId가 undefined면 조회하지 않는다(enabled:false)', async () => {
    const { useDeptLeaveUsageSummaryQuery } = await import('./useDeptLeaveUsageSummaryQuery')
    const { result } = renderHook(() => useDeptLeaveUsageSummaryQuery(undefined), {
      wrapper: createWrapper().Wrapper,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('deptId가 확정된 number이면 조회되고 leaveKeys.deptUsageSummary(deptId, params)로 캐시된다', async () => {
    const { useDeptLeaveUsageSummaryQuery } = await import('./useDeptLeaveUsageSummaryQuery')
    server.use(
      http.get(`${BASE_URL}/api/departments/1/employees/leaves/usage-summary`, () =>
        HttpResponse.json({ annualLeaveUsagePercent: 20.0 }),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { year: 2026 }
    const { result } = renderHook(() => useDeptLeaveUsageSummaryQuery(1, params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data).toEqual({ annualLeaveUsagePercent: 20.0 })

    const cached = queryClient.getQueryData(leaveKeys.deptUsageSummary(1, params))
    expect(cached).toEqual(result.current.data)
  })
})
