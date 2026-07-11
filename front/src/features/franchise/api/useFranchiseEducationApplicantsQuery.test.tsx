import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseEducationApplicantsQuery } from './useFranchiseEducationApplicantsQuery'

/**
 * useFranchiseEducationApplicantsQuery(FRANCHISE_EDUCATION_APPLICANTS, ROADMAP(FRANCHISE) T4.3) 검증.
 * useFranchisesQuery.test.tsx와 동일 관행.
 *
 * - educationId가 undefined면 enabled:false로 요청이 발생하지 않는다(상세 404 시 신청자 요청
 *   중복 실패 방지 가드).
 * - franchiseKeys.education.applicants(educationId, params)로 캐시된다.
 * - params(page) 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다.
 */

function applicant(id: number, name: string) {
  return {
    applicationId: id,
    externalId: `EXT-${id}`,
    franchiseId: id,
    franchiseName: name,
    contactNumber: '02-1234-5678',
    contactEmail: 'test@haruon.com',
    appliedCount: 1,
    appliedAt: '2026-05-01T09:00:00',
  }
}

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

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useFranchiseEducationApplicantsQuery', () => {
  it('educationId가 undefined면 요청이 발생하지 않는다(enabled:false)', () => {
    let getCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/:educationId/applicants`, () => {
        getCalls += 1
        return HttpResponse.json(makePage([]))
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseEducationApplicantsQuery(undefined), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getCalls).toBe(0)
  })

  it('franchiseKeys.education.applicants(educationId, params)로 캐시되고 응답이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1/applicants`, () =>
        HttpResponse.json(makePage([applicant(1, '테스트강남점')])),
      ),
    )
    const { queryClient, Wrapper } = createWrapper()
    const params = { page: 0, size: 10 }

    const { result } = renderHook(() => useFranchiseEducationApplicantsQuery(1, params), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].franchiseName).toBe('테스트강남점')
    const cached = queryClient.getQueryData(franchiseKeys.education.applicants(1, params))
    expect(cached).toEqual(result.current.data)
  })

  it('page 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1/applicants`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page')
        if (page === '1') {
          return HttpResponse.json(makePage([applicant(2, '역삼점')]))
        }
        return HttpResponse.json(makePage([applicant(1, '테스트강남점')]))
      }),
    )
    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      (params: { page: number; size: number }) => useFranchiseEducationApplicantsQuery(1, params),
      { wrapper: Wrapper, initialProps: { page: 0, size: 10 } },
    )

    await waitFor(() => expect(result.current.data?.content[0].franchiseName).toBe('테스트강남점'))
    expect(result.current.isLoading).toBe(false)

    rerender({ page: 1, size: 10 })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.content[0].franchiseName).toBe('테스트강남점')

    await waitFor(() => expect(result.current.data?.content[0].franchiseName).toBe('역삼점'))
    expect(result.current.isPlaceholderData).toBe(false)
  })
})
