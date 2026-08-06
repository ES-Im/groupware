import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useCompanyInfoQuery } from './useCompanyInfoQuery'
import { useCompanyRegisterMutation } from './useCompanyRegisterMutation'
import { useUpdateCompanyContactMutation } from './useUpdateCompanyContactMutation'
import { useUpdateCompanyHomePageURLMutation } from './useUpdateCompanyHomePageURLMutation'
import { useUpdateCompanyInfoMutation } from './useUpdateCompanyInfoMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper }
}

function companyFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    companyId: 1,
    companyName: 'HARUON',
    location: '서울특별시 강남구',
    presentedEmail: 'contact@haruon.com',
    presentedExternalNo: '02-1234-5678',
    ownerName: '김대표',
    homePageURL: 'https://haruon.com',
    editedAt: '2026-07-01T10:00:00',
    ...overrides,
  }
}

describe('company 등록/수정 mutation 성공 시 invalidate (F1402~F1405)', () => {
  it('최초 등록(F1402) 성공 시 companyKeys.all이 invalidate되어 미등록(null)에서 등록됨으로 재조회된다', async () => {
    let registered = false
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        registered
          ? HttpResponse.json(companyFixture())
          : HttpResponse.json(
              { code: 'COMPANY_NOT_FOUND', name: 'COMPANY_NOT_FOUND', httpStatus: 404, message: '등록된 회사 정보가 없습니다' },
              { status: 404 },
            ),
      ),
      http.post(`${BASE_URL}/api/companies/new`, () => {
        registered = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ info: useCompanyInfoQuery(), mutation: useCompanyRegisterMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.info.data).toBeNull())

    result.current.mutation.mutate({
      companyName: 'HARUON',
      location: '서울특별시 강남구',
      presentedEmail: 'contact@haruon.com',
      presentedExternalNo: '02-1234-5678',
      ownerName: '김대표',
      homePageURL: 'https://haruon.com',
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.info.data?.companyName).toBe('HARUON'))
  })

  it('기본정보 수정(F1403) 성공 시 companyKeys.all이 invalidate되어 재조회된다', async () => {
    let companyName = 'HARUON'
    server.use(
      http.get(`${BASE_URL}/api/companies`, () => HttpResponse.json(companyFixture({ companyName }))),
      http.post(`${BASE_URL}/api/companies/info`, () => {
        companyName = '하루온 주식회사'
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ info: useCompanyInfoQuery(), mutation: useUpdateCompanyInfoMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.info.data?.companyName).toBe('HARUON'))

    result.current.mutation.mutate({ companyName: '하루온 주식회사' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.info.data?.companyName).toBe('하루온 주식회사'))
  })

  it('연락처 수정(F1404) 성공 시 companyKeys.all이 invalidate되어 재조회된다', async () => {
    let presentedEmail = 'contact@haruon.com'
    server.use(
      http.get(`${BASE_URL}/api/companies`, () => HttpResponse.json(companyFixture({ presentedEmail }))),
      http.post(`${BASE_URL}/api/companies/contact`, () => {
        presentedEmail = 'new@haruon.com'
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ info: useCompanyInfoQuery(), mutation: useUpdateCompanyContactMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.info.data?.presentedEmail).toBe('contact@haruon.com'))

    result.current.mutation.mutate({ presentedEmail: 'new@haruon.com' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.info.data?.presentedEmail).toBe('new@haruon.com'))
  })

  it('홈페이지 URL 수정(F1405) 성공 시 companyKeys.all이 invalidate되어 재조회된다', async () => {
    let homePageURL = 'https://haruon.com'
    server.use(
      http.get(`${BASE_URL}/api/companies`, () => HttpResponse.json(companyFixture({ homePageURL }))),
      http.post(`${BASE_URL}/api/companies/home-page-url`, () => {
        homePageURL = 'https://new.haruon.com'
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ info: useCompanyInfoQuery(), mutation: useUpdateCompanyHomePageURLMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.info.data?.homePageURL).toBe('https://haruon.com'))

    result.current.mutation.mutate({ homePageURL: 'https://new.haruon.com' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.info.data?.homePageURL).toBe('https://new.haruon.com'))
  })

  it('등록(F1402) 실패 시 invalidate되지 않고 mutation.isError가 true다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/companies/new`, () =>
        HttpResponse.json(
          { code: 'COMPANY_002', name: 'COMPANY_ALREADY_EXISTS', httpStatus: 400, message: '이미 등록된 회사 정보가 있습니다' },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useCompanyRegisterMutation(), { wrapper: Wrapper })

    result.current.mutate({
      companyName: 'HARUON',
      location: '서울특별시 강남구',
      presentedEmail: 'contact@haruon.com',
      presentedExternalNo: '02-1234-5678',
      ownerName: '김대표',
      homePageURL: 'https://haruon.com',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as { message?: string } | null)?.message).toBeDefined()
  })
})
