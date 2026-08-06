import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useMeetingRoomFilesQuery } from './useMeetingRoomFilesQuery'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useMeetingRoomFilesQuery', () => {
  it('meetingRoomId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomFilesQuery(undefined), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('meetingRoomId 확정 시 meetingKeys.roomFiles(id)로 캐시된다', async () => {
    const files = [{ fileId: 1, originalName: 'a.png', extension: 'png', fileSize: 1024 }]
    server.use(http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json(files)))

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomFilesQuery(3), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual(files)

    const cached = queryClient.getQueryData(meetingKeys.roomFiles(3))
    expect(cached).toEqual(files)
  })
})
