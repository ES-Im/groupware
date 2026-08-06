import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { employeeKeys } from '../../model/queryKeys'
import { useNewEmployeesQuery } from './useNewEmployeesQuery'

function makePage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function record(empId: number, name: string) {
  return {
    empId,
    empNo: `20260700${empId}`,
    name,
    loginId: `login${empId}`,
    email: `emp${empId}@haruon.com`,
    extensionNo: '',
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

describe('useNewEmployeesQuery', () => {
  it('employeeKeys.newEmployees(params)로 캐시되고, 응답 Page가 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () => HttpResponse.json(makePage([record(1, '홍길동')]))),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { page: 0, size: 10 }
    const { result } = renderHook(() => useNewEmployeesQuery(params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].name).toBe('홍길동')
    const cached = queryClient.getQueryData(employeeKeys.newEmployees(params))
    expect(cached).toEqual(result.current.data)
  })

  it('keyword 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, ({ request }) => {
        const keyword = new URL(request.url).searchParams.get('keyword')
        if (keyword === '김철수') {
          return HttpResponse.json(makePage([record(2, '김철수')]))
        }
        return HttpResponse.json(makePage([record(1, '홍길동')]))
      }),
    )

    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      ({ keyword }: { keyword?: string }) => useNewEmployeesQuery({ keyword, page: 0, size: 10 }),
      { wrapper: Wrapper, initialProps: { keyword: undefined } },
    )

    await waitFor(() => expect(result.current.data?.content[0].name).toBe('홍길동'))
    expect(result.current.isLoading).toBe(false)

    rerender({ keyword: '김철수' })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].name).toBe('홍길동')

    await waitFor(() => expect(result.current.data?.content[0].name).toBe('김철수'))
    expect(result.current.isPlaceholderData).toBe(false)
  })
})
