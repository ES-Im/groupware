import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useDepartmentsQuery } from './useDepartmentsQuery'

function makePage(items: unknown[], page: number) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: page,
    size: 10,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function deptSummary(deptId: number, deptName: string, hasLeader: boolean) {
  return {
    deptInfoResponse: { deptId, deptCode: String(deptId).padStart(3, '0'), deptName, isActive: true, parentDeptId: null },
    deptLeader: hasLeader
      ? { empId: 1, empNo: 'E001', empName: '홍길동', extensionNo: null, email: 'leader@haruon.com', position: '팀장' }
      : { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDepartmentsQuery', () => {
  it('all-null deptLeader wire를 null로 정규화해 반환한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(makePage([deptSummary(1, '본사', false)], 0)),
      ),
    )

    const { result } = renderHook(() => useDepartmentsQuery({ page: 0, size: 10 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.content[0].deptLeader).toBeNull()
  })

  it('keyword 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, ({ request }) => {
        const url = new URL(request.url)
        const keyword = url.searchParams.get('keyword')
        if (keyword === '개발') {
          return HttpResponse.json(makePage([deptSummary(2, '개발팀', true)], 0))
        }
        return HttpResponse.json(makePage([deptSummary(1, '본사', false)], 0))
      }),
    )

    const { result, rerender } = renderHook(
      ({ keyword }: { keyword?: string }) => useDepartmentsQuery({ keyword, page: 0, size: 10 }),
      { wrapper: createWrapper(), initialProps: { keyword: undefined } },
    )

    await waitFor(() => expect(result.current.data?.content[0].deptInfoResponse.deptName).toBe('본사'))
    expect(result.current.isLoading).toBe(false)

    rerender({ keyword: '개발' })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].deptInfoResponse.deptName).toBe('본사')

    await waitFor(() =>
      expect(result.current.data?.content[0].deptInfoResponse.deptName).toBe('개발팀'),
    )
    expect(result.current.isPlaceholderData).toBe(false)
    expect(result.current.data?.content[0].deptLeader).not.toBeNull()
  })
})
