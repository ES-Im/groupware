import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useDepartmentMembersQuery } from './useDepartmentMembersQuery'

/**
 * useDepartmentMembersQuery(T2.1-a/T7.1) keepPreviousData 검증.
 *
 * 부서 상세 화면에서 멤버 검색어/페이지가 바뀔 때마다 매번 새 캐시 엔트리(queryKey에 params
 * 포함)라 이전 목록이 유지되지 않으면 좌측 부서 카드까지 전면 재로딩/깜빡이는 결함이
 * 재현된다(DepartmentMembersPage에 실측된 결함, DepartmentDetailPage/T7.1은 이를 재현하지
 * 않아야 함). keepPreviousData가 적용되어 있으면 페이지 변경 시에도 isLoading이 다시 true가
 * 되지 않고, 새 응답 도착 전까지 이전 데이터가 유지된다.
 */

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

    // 새 페이지 데이터가 도착하기 전에도 isLoading은 false로 유지되어야 하고(전면 깜빡임 방지),
    // 이전 페이지 데이터를 placeholder로 계속 노출해야 한다.
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
