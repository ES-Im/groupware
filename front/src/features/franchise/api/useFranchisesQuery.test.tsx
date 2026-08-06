import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isForbidden } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchisesQuery } from './useFranchisesQuery'

function franchise(id: number, name: string, managerEmpId: number) {
  return {
    id,
    name,
    address: '서울특별시 강남구',
    ownerName: '홍길동',
    BusinessStatus: '정상 영업 중',
    managerEmpId,
    managerEmpName: '김담당',
  }
}

function makePage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    first: true,
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

describe('useFranchisesQuery', () => {
  it('franchiseKeys.list(params)로 캐시되고, Page<Franchise> 응답이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchises`, () =>
        HttpResponse.json(makePage([franchise(1, '테스트강남점', 7)])),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { managerId: 7, size: 50 }
    const { result } = renderHook(() => useFranchisesQuery(params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].name).toBe('테스트강남점')
    expect(result.current.data?.content[0].BusinessStatus).toBe('정상 영업 중')

    const cached = queryClient.getQueryData(franchiseKeys.list(params))
    expect(cached).toEqual(result.current.data)
  })

  it('managerId→keyword 모드 전환 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchises`, ({ request }) => {
        const url = new URL(request.url)
        const keyword = url.searchParams.get('keyword')
        if (keyword === '역삼') {
          return HttpResponse.json(makePage([franchise(2, '역삼점', 7)]))
        }
        return HttpResponse.json(makePage([franchise(1, '테스트강남점', 7)]))
      }),
    )

    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      (params: { managerId?: number; keyword?: string; size: number }) => useFranchisesQuery(params),
      { wrapper: Wrapper, initialProps: { managerId: 7, size: 50 } },
    )

    await waitFor(() => expect(result.current.data?.content[0].name).toBe('테스트강남점'))
    expect(result.current.isLoading).toBe(false)

    rerender({ keyword: '역삼', size: 50 })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].name).toBe('테스트강남점')

    await waitFor(() => expect(result.current.data?.content[0].name).toBe('역삼점'))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('403(ROLE_003) 응답이 그대로 throw되어 error에 반영되고 normalizeApiError로 isForbidden 판정된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchises`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFranchisesQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(isForbidden(normalized)).toBe(true)
    expect(normalized.code).toBe('ROLE_003')
  })
})
