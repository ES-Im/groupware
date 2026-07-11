import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseEducationDetailQuery } from './useFranchiseEducationDetailQuery'

/**
 * useFranchiseEducationDetailQuery(FRANCHISE_EDUCATION_DETAIL, ROADMAP(FRANCHISE) T4.3) 검증.
 * useFranchisesQuery.test.tsx와 동일 관행.
 *
 * - educationId가 undefined면 enabled:false로 요청 자체가 발생하지 않는다.
 * - franchiseKeys.education.detail(educationId)로 캐시된다.
 * - 404 응답이 그대로 throw되어 isNotFound로 판정 가능하다.
 */

function detail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    date: '2026-05-01',
    startAt: '10:00:00',
    place: '본사 3층 강당',
    title: '신규 가맹점 오리엔테이션',
    content: '가맹 운영 기본 교육입니다',
    appliedCount: 0,
    capacity: 20,
    remainingCapacity: 20,
    isActive: true,
    fileListInfoList: null,
    ...overrides,
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

describe('useFranchiseEducationDetailQuery', () => {
  it('educationId가 undefined면 요청이 발생하지 않는다(enabled:false)', async () => {
    let getCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/:educationId`, () => {
        getCalls += 1
        return HttpResponse.json(detail())
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseEducationDetailQuery(undefined), {
      wrapper: Wrapper,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getCalls).toBe(0)
  })

  it('franchiseKeys.education.detail(educationId)로 캐시되고 응답이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1`, () => HttpResponse.json(detail())),
    )
    const { queryClient, Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseEducationDetailQuery(1), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.title).toBe('신규 가맹점 오리엔테이션')
    const cached = queryClient.getQueryData(franchiseKeys.education.detail(1))
    expect(cached).toEqual(result.current.data)
  })

  it('404 응답이 그대로 throw되어 isNotFound로 판정된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/999`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '교육을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseEducationDetailQuery(999), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(isNotFound(normalized)).toBe(true)
  })
})
