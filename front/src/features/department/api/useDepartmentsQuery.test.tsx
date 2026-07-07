import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useDepartmentsQuery } from './useDepartmentsQuery'

/**
 * useDepartmentsQuery(T6.2) 실동작 검증.
 *
 * - keyword/isActive/page/size 변경 시 keepPreviousData로 이전 목록을 유지해, 화면이 매번
 *   "불러오는 중..."으로 전면 교체(깜빡임)되지 않아야 한다(isLoading은 최초 1회만 true).
 * - 응답 content[].deptLeader가 all-null wire여도 normalizeDeptLeader에 의해 null로 정규화된다
 *   (T6.1 재사용 확인).
 */

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

    // keepPreviousData가 적용되면 새 데이터가 도착하기 전에도 isLoading은 false로 유지되고
    // (isFetching만 true), 화면에 표시되는 content는 새 응답이 오기 전까지 이전 값을 유지한다.
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].deptInfoResponse.deptName).toBe('본사')

    await waitFor(() =>
      expect(result.current.data?.content[0].deptInfoResponse.deptName).toBe('개발팀'),
    )
    expect(result.current.isPlaceholderData).toBe(false)
    // 검색 결과에 부서장이 지정된 데이터도 정상적으로 정규화되어 있어야 한다.
    expect(result.current.data?.content[0].deptLeader).not.toBeNull()
  })
})
