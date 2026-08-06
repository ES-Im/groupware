import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { approvalKeys } from '../model/queryKeys'
import type { SalesDraftPayload } from './createSalesDraft'
import { useSalesDraftCreateMutation } from './useSalesDraftCreateMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper }
}

function useProbeQuery() {
  return useQuery({
    queryKey: approvalKeys.draftDetail(55),
    queryFn: async () =>
      (await fetch(`${BASE_URL}/api/drafts/55`)).json() as Promise<{ version: number }>,
  })
}

function payload(overrides: Partial<SalesDraftPayload> = {}): SalesDraftPayload {
  return {
    param: { title: '7월 매출 보고', content: '7월 매출 실적을 보고합니다' },
    franchiseId: 1,
    reportMonth: '2026-07',
    salesAmount: 10000000,
    ...overrides,
  }
}

describe('useSalesDraftCreateMutation (SALES_DRAFT_CREATE, F760)', () => {
  it('생성 성공(201 {draftId}) 시 approvalKeys.all이 invalidate되어 프로브 쿼리가 재조회된다', async () => {
    let version = 1
    server.use(
      http.get(`${BASE_URL}/api/drafts/55`, () => HttpResponse.json({ version })),
      http.post(`${BASE_URL}/api/drafts/sales`, () => {
        version = 2
        return HttpResponse.json({ draftId: 55 }, { status: 201 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ probe: useProbeQuery(), mutation: useSalesDraftCreateMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 1 }))

    result.current.mutation.mutate({ payload: payload(), submit: false })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(result.current.mutation.data).toEqual({ draftId: 55 })
    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 2 }))
  })

  it('submit=true면 /api/drafts/sales/submission을 호출하고 성공 시에도 invalidate된다', async () => {
    let version = 1
    let submissionCalled = false
    server.use(
      http.get(`${BASE_URL}/api/drafts/55`, () => HttpResponse.json({ version })),
      http.post(`${BASE_URL}/api/drafts/sales/submission`, () => {
        submissionCalled = true
        version = 2
        return HttpResponse.json({ draftId: 55 }, { status: 201 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ probe: useProbeQuery(), mutation: useSalesDraftCreateMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 1 }))

    result.current.mutation.mutate({ payload: payload(), submit: true })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(submissionCalled).toBe(true)
    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 2 }))
  })

  it('서버 도메인 에러(매출액 0 이하 등) 시 mutation이 isError 상태가 되고 프로브 쿼리는 갱신되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/drafts/55`, () => HttpResponse.json({ version: 1 })),
      http.post(`${BASE_URL}/api/drafts/sales`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '매출액은 0보다 커야 합니다' },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ probe: useProbeQuery(), mutation: useSalesDraftCreateMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 1 }))

    result.current.mutation.mutate({ payload: payload({ salesAmount: 0 }), submit: false })

    await waitFor(() => expect(result.current.mutation.isError).toBe(true))
    expect(result.current.probe.data).toEqual({ version: 1 })
  })
})
