import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useMeetingRoomDetailQuery } from './useMeetingRoomDetailQuery'
import { useMeetingRoomFilesQuery } from './useMeetingRoomFilesQuery'
import { useMeetingRoomManagementListQuery } from './useMeetingRoomManagementListQuery'
import { useMeetingRoomUpdateMutation } from './useMeetingRoomUpdateMutation'

/**
 * useMeetingRoomUpdateMutation(F813, ROADMAP(MEETING-ROOMS) T7.1) 성공 후 invalidate 검증.
 * 성공(204) 시 roomDetail·roomFiles·roomManagement(목록) 3개 쿼리 모두 invalidate되는지
 * 블랙박스로 확인한다(boardFileMutations.invalidate.test.tsx와 동일 관행).
 */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

describe('useMeetingRoomUpdateMutation - 3개 쿼리 동시 invalidate', () => {
  it('수정 성공(204) 시 roomDetail·roomFiles·roomManagement가 모두 재조회된다', async () => {
    let name = '기존이름'
    let fileCount = 0

    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/1`, () =>
        HttpResponse.json({ meetingRoomId: 1, name, description: '설명', capacity: 10, isAvailable: true }),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/1/files`, () =>
        HttpResponse.json(
          Array.from({ length: fileCount }, (_, i) => ({
            fileId: i + 1,
            originalName: `room-${i + 1}.jpg`,
            extension: 'jpg',
            fileSize: 100,
          })),
        ),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () =>
        HttpResponse.json({
          content: [{ meetingRoomId: 1, name, capacity: 10, isAvailable: true }],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10,
          numberOfElements: 1,
          first: true,
          last: true,
          empty: false,
        }),
      ),
      http.patch(`${BASE_URL}/api/meeting-rooms/1`, () => {
        name = '변경된이름'
        fileCount = 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useMeetingRoomDetailQuery(1),
        files: useMeetingRoomFilesQuery(1),
        list: useMeetingRoomManagementListQuery({ page: 0, size: 10 }),
        mutation: useMeetingRoomUpdateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.name).toBe('기존이름'))
    await waitFor(() => expect(result.current.list.data?.content[0].name).toBe('기존이름'))
    await waitFor(() => expect(result.current.files.data).toHaveLength(0))

    result.current.mutation.mutate({ meetingRoomId: 1, payload: { name: '변경된이름' } })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.name).toBe('변경된이름'))
    await waitFor(() => expect(result.current.list.data?.content[0].name).toBe('변경된이름'))
    await waitFor(() => expect(result.current.files.data).toHaveLength(1))
  })
})
