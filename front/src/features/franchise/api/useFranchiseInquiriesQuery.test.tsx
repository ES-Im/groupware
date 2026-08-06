import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isForbidden } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseInquiriesQuery } from './useFranchiseInquiriesQuery'

function inquiry(id: number, title: string, isAnswered: boolean) {
  return {
    inquiryId: id,
    externalId: `EXT-${id}`,
    franchiseId: 10,
    franchiseName: '테스트강남점',
    inquiryTitle: title,
    inquiryAt: '2026-07-01T10:00:00',
    isAnswered,
    assignedManagerId: 7,
    assignedManagerName: '김담당',
    isDeleted: false,
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

describe('useFranchiseInquiriesQuery', () => {
  it('franchiseKeys.inquiry.list(params)로 캐시되고, Page<FranchiseInquiry> 응답이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries`, () =>
        HttpResponse.json(makePage([inquiry(1, '환불 문의', false)])),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { assignedManagerId: 7, size: 50 }
    const { result } = renderHook(() => useFranchiseInquiriesQuery(params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].inquiryTitle).toBe('환불 문의')
    expect(result.current.data?.content[0].isAnswered).toBe(false)

    const cached = queryClient.getQueryData(franchiseKeys.inquiry.list(params))
    expect(cached).toEqual(result.current.data)
  })

  it('답변여부 필터 전환 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries`, ({ request }) => {
        const url = new URL(request.url)
        const isAnswered = url.searchParams.get('isAnswered')
        if (isAnswered === 'true') {
          return HttpResponse.json(makePage([inquiry(2, '답변완료 문의', true)]))
        }
        return HttpResponse.json(makePage([inquiry(1, '환불 문의', false)]))
      }),
    )

    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      (params: { isAnswered?: boolean; size: number }) => useFranchiseInquiriesQuery(params),
      { wrapper: Wrapper, initialProps: { isAnswered: false, size: 50 } },
    )

    await waitFor(() => expect(result.current.data?.content[0].inquiryTitle).toBe('환불 문의'))
    expect(result.current.isLoading).toBe(false)

    rerender({ isAnswered: true, size: 50 })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].inquiryTitle).toBe('환불 문의')

    await waitFor(() => expect(result.current.data?.content[0].inquiryTitle).toBe('답변완료 문의'))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('403(ROLE_003) 응답이 그대로 throw되어 error에 반영되고 normalizeApiError로 isForbidden 판정된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFranchiseInquiriesQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(isForbidden(normalized)).toBe(true)
    expect(normalized.code).toBe('ROLE_003')
  })
})
