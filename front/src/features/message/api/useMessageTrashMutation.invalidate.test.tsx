import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { messageKeys } from '../model/messageKeys'
import { useMessageTrashMutation } from './useMessageTrashMutation'

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

function useProbeQuery() {
  return useQuery({
    queryKey: messageKeys.detail(1),
    queryFn: async () =>
      (await fetch(`${BASE_URL}/api/messages/1`)).json() as Promise<{ version: number }>,
  })
}

describe('useMessageTrashMutation (SENT_/RECEIVED_MESSAGE_TRASH, F1512)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('휴지통 이동 성공(204) 시 messageKeys.all이 invalidate되어 상세 쿼리가 재조회되고 성공 토스트를 띄운다', async () => {
    let version = 1
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/messages/1`, () => HttpResponse.json({ version })),
      http.patch(`${BASE_URL}/api/messages/received/1/trash`, () => {
        patchSpy()
        version = 2
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ probe: useProbeQuery(), mutation: useMessageTrashMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 1 }))

    result.current.mutation.mutate({ messageId: 1, isSentByMe: false })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.probe.data).toEqual({ version: 2 }))
    expect(patchSpy).toHaveBeenCalledTimes(1)

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('쪽지를 휴지통으로 이동했습니다')
  })

  it('isSentByMe=true면 sent 세그먼트로 PATCH한다', async () => {
    let capturedPath: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/messages/sent/7/trash`, ({ request }) => {
        capturedPath = new URL(request.url).pathname
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useMessageTrashMutation(), { wrapper: Wrapper })

    result.current.mutate({ messageId: 7, isSentByMe: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedPath).toBe('/api/messages/sent/7/trash')
  })

  it('서버 도메인 에러 시 에러 토스트가 노출되고 성공 토스트는 뜨지 않는다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/messages/received/1/trash`, () =>
        HttpResponse.json(
          { code: 'MESSAGE_FORBIDDEN', name: 'FORBIDDEN', httpStatus: 403, message: '휴지통으로 이동할 권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useMessageTrashMutation(), { wrapper: Wrapper })

    result.current.mutate({ messageId: 1, isSentByMe: false })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('휴지통으로 이동할 권한이 없습니다'),
    )
    expect(toast.success).not.toHaveBeenCalled()
  })
})
