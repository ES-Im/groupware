import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { companyKeys } from '../model/companyKeys'
import { useCompanyInfoQuery } from './useCompanyInfoQuery'

/**
 * useCompanyInfoQuery(COMPANY_INFO, ROADMAP-COMPANY T1.1) 실동작 검증.
 *
 * getCompanyInfo가 404를 null로 정규화하므로, 이 훅은 "isLoading/query.error(진짜 실패)/
 * data===null(미등록)/data(등록됨)" 4가지로 분기 가능해야 한다. 컴포넌트(CompanyInfoPage)가
 * 이 분기를 실제로 사용하므로, 훅 레벨에서 queryKey와 각 상태를 격리해 확인한다.
 */

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCompanyInfoQuery', () => {
  it('queryKey로 companyKeys.info()를 사용한다', () => {
    expect(companyKeys.info()).toEqual(['company', 'info'])
  })

  it('로딩 중에는 isLoading이 true다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useCompanyInfoQuery(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('200 응답이면 회사 정보 데이터를 그대로 반환한다', async () => {
    const fixture = {
      companyId: 1,
      companyName: 'HARUON',
      location: '서울특별시 강남구',
      presentedEmail: 'contact@haruon.com',
      presentedExternalNo: '02-1234-5678',
      ownerName: '김대표',
      homePageURL: 'https://haruon.com',
      editedAt: '2026-07-01T10:00:00',
    }
    server.use(http.get(`${BASE_URL}/api/companies`, () => HttpResponse.json(fixture)))

    const { result } = renderHook(() => useCompanyInfoQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fixture)
    expect(result.current.error).toBeNull()
  })

  it('404 응답이면 에러가 아니라 data===null(미등록)로 성공 처리된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        HttpResponse.json(
          { code: 'COMPANY_NOT_FOUND', name: 'COMPANY_NOT_FOUND', httpStatus: 404, message: '등록된 회사 정보가 없습니다' },
          { status: 404 },
        ),
      ),
    )

    const { result } = renderHook(() => useCompanyInfoQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('404가 아닌 실패(500)는 query.error로 전파된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'INTERNAL_SERVER_ERROR', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )

    const { result } = renderHook(() => useCompanyInfoQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
