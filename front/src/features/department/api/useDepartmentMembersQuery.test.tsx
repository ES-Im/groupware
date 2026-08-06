import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useDepartmentMembersQuery } from './useDepartmentMembersQuery'

function makePage(names: string[], page: number) {
  return {
    content: names.map((name, i) => ({
      empId: page * 10 + i + 1,
      empNo: `E${String(page * 10 + i + 1).padStart(3, '0')}`,
      empName: name,
      extensionNo: null,
      email: `${name}@haruon.com`,
      position: '사원',
    })),
    totalElements: names.length,
    totalPages: 2,
    number: page,
    size: 10,
    first: page === 0,
    last: page !== 0,
    numberOfElements: names.length,
    empty: names.length === 0,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDepartmentMembersQuery', () => {
  it('page 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments/1/members`, ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '0')
        return HttpResponse.json(
          page === 0 ? makePage(['홍길동'], 0) : makePage(['김철수'], 1),
        )
      }),
    )

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useDepartmentMembersQuery(1, { page, size: 10 }),
      { wrapper: createWrapper(), initialProps: { page: 0 } },
    )

    await waitFor(() => expect(result.current.data?.content[0].empName).toBe('홍길동'))
    expect(result.current.isLoading).toBe(false)

    rerender({ page: 1 })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].empName).toBe('홍길동')

    await waitFor(() => expect(result.current.data?.content[0].empName).toBe('김철수'))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('deptId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { result } = renderHook(() => useDepartmentMembersQuery(undefined, { page: 0 }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
