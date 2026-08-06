import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { approvalKeys } from '../model/queryKeys'
import { useSalesDraftUpdateMutation } from './useSalesDraftUpdateMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper }
}

function useDetailProbe(draftId: number) {
  return useQuery({
    queryKey: approvalKeys.draftDetail(draftId),
    queryFn: async () =>
      (await fetch(`${BASE_URL}/api/drafts/${draftId}`)).json() as Promise<{ version: number }>,
  })
}

function useListProbe() {
  return useQuery({
    queryKey: approvalKeys.submitted(),
    queryFn: async () =>
      (await fetch(`${BASE_URL}/api/drafts/submitted`)).json() as Promise<{ version: number }>,
  })
}

describe('useSalesDraftUpdateMutation (SALES_DRAFT_UPDATE, F761)', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('성공(204) 시 draftId를 path param으로 PATCH /api/drafts/sales/{draftId}를 호출한다', async () => {
    let capturedUrl: string | null = null
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE_URL}/api/drafts/sales/7`, async ({ request }) => {
        capturedUrl = new URL(request.url).pathname
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSalesDraftUpdateMutation(), { wrapper: Wrapper })

    result.current.mutate({
      draftId: 7,
      payload: { salesAmount: 1500000 },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedUrl).toBe('/api/drafts/sales/7')
    expect(capturedBody).toEqual({ salesAmount: 1500000 })
  })

  it('성공(204) 시 approvalKeys.draftDetail(draftId)와 approvalKeys.all이 모두 invalidate되어 재조회된다', async () => {
    let detailVersion = 1
    let listVersion = 1
    server.use(
      http.get(`${BASE_URL}/api/drafts/7`, () => HttpResponse.json({ version: detailVersion })),
      http.get(`${BASE_URL}/api/drafts/submitted`, () => HttpResponse.json({ version: listVersion })),
      http.patch(`${BASE_URL}/api/drafts/sales/7`, () => {
        detailVersion = 2
        listVersion = 2
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useDetailProbe(7),
        list: useListProbe(),
        mutation: useSalesDraftUpdateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data).toEqual({ version: 1 }))
    await waitFor(() => expect(result.current.list.data).toEqual({ version: 1 }))

    result.current.mutation.mutate({ draftId: 7, payload: { salesAmount: 1500000 } })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail.data).toEqual({ version: 2 }))
    await waitFor(() => expect(result.current.list.data).toEqual({ version: 2 }))
  })

  it('실패(서버 도메인 에러) 시 isError가 true이고, 캐시가 invalidate되지 않아 목록 프로브는 재조회되지 않는다', async () => {
    let listCallCount = 0
    server.use(
      http.get(`${BASE_URL}/api/drafts/submitted`, () => {
        listCallCount += 1
        return HttpResponse.json({ version: 1 })
      }),
      http.patch(`${BASE_URL}/api/drafts/sales/7`, () =>
        HttpResponse.json(
          {
            code: 'DRAFT_ALREADY_SUBMITTED',
            name: 'DRAFT_ALREADY_SUBMITTED',
            httpStatus: 400,
            message: '이미 상신된 기안은 수정할 수 없습니다',
          },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ list: useListProbe(), mutation: useSalesDraftUpdateMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data).toEqual({ version: 1 }))
    expect(listCallCount).toBe(1)

    result.current.mutation.mutate({ draftId: 7, payload: { salesAmount: 1500000 } })

    await waitFor(() => expect(result.current.mutation.isError).toBe(true))
    expect(listCallCount).toBe(1)
  })
})
