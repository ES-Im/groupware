import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useEmpLeaveHistoryQuery } from './useEmpLeaveHistoryQuery'

function makeRow(empId: number, draftId: number) {
  return {
    empId,
    empNo: `20260700${empId}`,
    empName: `사원${empId}`,
    historyResponse: {
      draftId,
      leaveType: '연차',
      startAt: '2026-07-01',
      endAt: '2026-07-01',
      requestedLeaveDays: 1,
      approvalStatus: '결재대기',
    },
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

describe('useEmpLeaveHistoryQuery', () => {
  it('deptId/empId가 모두 확정되고 enabled=true면 조회 후 empId가 일치하는 행들만 filter한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/leaves/departments/1/request-history`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('yearMonth')).toBe('2026-07')
        expect(url.searchParams.get('size')).toBe('100')
        return HttpResponse.json(makePage([makeRow(5, 1), makeRow(7, 2), makeRow(7, 3)]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpLeaveHistoryQuery(1, 7, '2026-07', true), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.every((row) => row.empId === 7)).toBe(true)
  })

  it('enabled=false면 요청 자체가 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/leaves/departments/1/request-history`, () => {
        spy()
        return HttpResponse.json(makePage([]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpLeaveHistoryQuery(1, 7, '2026-07', false), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('deptId가 undefined면 enabled=true여도 요청이 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/leaves/departments/1/request-history`, () => {
        spy()
        return HttpResponse.json(makePage([]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpLeaveHistoryQuery(undefined, 7, '2026-07', true), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('empId가 undefined면 enabled=true여도 요청이 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/leaves/departments/1/request-history`, () => {
        spy()
        return HttpResponse.json(makePage([]))
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpLeaveHistoryQuery(1, undefined, '2026-07', true), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })
})
