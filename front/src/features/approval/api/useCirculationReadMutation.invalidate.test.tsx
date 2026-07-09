import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { approvalKeys } from '../model/queryKeys'
import { useCirculationReadMutation } from './useCirculationReadMutation'

/**
 * useCirculationReadMutation(DRAFT_CIRCULATION_READ, F709, ROADMAP(DRAFT) T5.1) 성공/실패 동작 테스트.
 * board `*.invalidate.test.tsx` 관행을 복제: mock을 가로채지 않고 "성공(204) 후 approvalKeys.all에
 * 걸린 쿼리가 실제로 재조회되어 최신 값을 반영하는지"를 블랙박스로 확인한다. 실패(도메인 에러)는
 * handleApiError → 에러 토스트 경로를 검증한다.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper }
}

/** approvalKeys.all 축에 매달린 임의의 쿼리(상세 대용) — invalidate 전파를 관측하기 위한 프로브. */
function useProbeQuery() {
  return useQuery({
    queryKey: approvalKeys.draftDetail(1),
    queryFn: async () =>
      (await fetch(`${BASE_URL}/api/drafts/1`)).json() as Promise<{ version: number }>,
  })
}

describe('useCirculationReadMutation (DRAFT_CIRCULATION_READ, F709)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('읽음 처리 성공(204) 시 approvalKeys.all이 invalidate되어 상세 쿼리가 재조회된다', async () => {
    let version = 1
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/drafts/1`, () => HttpResponse.json({ version })),
      http.patch(`${BASE_URL}/api/drafts/1/circulations/me/read`, () => {
        patchSpy()
        version = 2 // 읽음 처리 후 서버 상태가 바뀐 것을 모사
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ probe: useProbeQuery(), mutation: useCirculationReadMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 1 }))

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 2 }))
    expect(patchSpy).toHaveBeenCalledTimes(1)

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('공람을 읽음 처리했습니다')
  })

  it('PATCH가 올바른 경로(/api/drafts/{draftId}/circulations/me/read)로 draftId를 전달한다', async () => {
    let capturedUrl: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/drafts/7/circulations/me/read`, ({ request }) => {
        capturedUrl = new URL(request.url).pathname
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useCirculationReadMutation(), { wrapper: Wrapper })

    result.current.mutate(7)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedUrl).toBe('/api/drafts/7/circulations/me/read')
  })

  it('서버 도메인 에러(이미 읽은 공람) 시 에러 토스트가 노출되고 성공 토스트는 뜨지 않는다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/drafts/1/circulations/me/read`, () =>
        HttpResponse.json(
          {
            code: 'CIRCULATION_ALREADY_READ',
            name: 'CIRCULATION_ALREADY_READ',
            httpStatus: 400,
            message: '이미 읽은 공람입니다',
          },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useCirculationReadMutation(), { wrapper: Wrapper })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isError).toBe(true))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 읽은 공람입니다'))
    expect(toast.success).not.toHaveBeenCalled()
  })
})
