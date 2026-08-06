import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useEmpForManagementQuery } from './useEmpForManagementQuery'

function makeRecord(empId: number) {
  return {
    empId,
    empNo: `20260700${empId}`,
    empName: `사원${empId}`,
    loginId: `login${empId}`,
    email: `emp${empId}@haruon.com`,
    extensionNo: null,
    status: 'ACTIVE',
    hireAt: '2024-01-01',
    resignAt: null,
    belongings: [],
    systemRoleCodeName: ['EMPLOYEE'],
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

describe('useEmpForManagementQuery', () => {
  it('deptId/empId가 모두 확정되고 enabled=true면 조회 후 empId가 일치하는 레코드만 select한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('deptId')).toBe('1')
        expect(url.searchParams.get('size')).toBe('100')
        return HttpResponse.json({
          content: [makeRecord(5), makeRecord(7)],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 100,
          numberOfElements: 2,
          first: true,
          last: true,
          empty: false,
        })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpForManagementQuery(1, 7, true), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.empId).toBe(7)
  })

  it('enabled=false면 요청 자체가 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/employees`, () => {
        spy()
        return HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 100,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpForManagementQuery(1, 7, false), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('deptId가 undefined면 enabled=true여도 요청이 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/employees`, () => {
        spy()
        return HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 100,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpForManagementQuery(undefined, 7, true), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('empId가 undefined면 enabled=true여도 요청이 나가지 않는다', async () => {
    const spy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/employees`, () => {
        spy()
        return HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 100,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useEmpForManagementQuery(1, undefined, true), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })
})
