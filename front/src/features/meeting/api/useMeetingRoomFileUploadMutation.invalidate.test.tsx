import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomFileValidationError } from '../lib/meetingRoomFileValidation'
import { useMeetingRoomDetailQuery } from './useMeetingRoomDetailQuery'
import { useMeetingRoomFileDeleteMutation } from './useMeetingRoomFileDeleteMutation'
import { useMeetingRoomFilesQuery } from './useMeetingRoomFilesQuery'
import { useMeetingRoomFileUploadMutation } from './useMeetingRoomFileUploadMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

function makeFile(name: string, size = 100): File {
  return new File([new Uint8Array(size)], name)
}

describe('useMeetingRoomFileUploadMutation', () => {
  it('업로드 성공(204) 시 roomDetail·roomFiles가 모두 invalidate되어 재조회된다', async () => {
    let isAvailable = true
    let files: unknown[] = []
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/1`, () =>
        HttpResponse.json({ meetingRoomId: 1, name: '대회의실', description: '설명', capacity: 10, isAvailable }),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/1/files`, () => HttpResponse.json(files)),
      http.patch(`${BASE_URL}/api/meeting-rooms/1/files`, () => {
        files = [{ fileId: 1, originalName: 'room.jpg', extension: 'jpg', fileSize: 100 }]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useMeetingRoomDetailQuery(1),
        files: useMeetingRoomFilesQuery(1),
        mutation: useMeetingRoomFileUploadMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.files.data).toEqual([]))

    result.current.mutation.mutate({ meetingRoomId: 1, files: [makeFile('room.jpg')] })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.files.data).toHaveLength(1))
    expect(isAvailable).toBe(true)
  })

  it('사전검증 위반(비허용 확장자)이면 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useMeetingRoomFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ meetingRoomId: 1, files: [makeFile('virus.exe')] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error as MeetingRoomFileValidationError
    expect(error).toBeInstanceOf(MeetingRoomFileValidationError)
    expect(error.reason).toBe('EXTENSION_NOT_ALLOWED')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('사전검증 위반(10MB 초과)이면 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useMeetingRoomFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ meetingRoomId: 1, files: [makeFile('room.png', 11 * 1024 * 1024)] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as MeetingRoomFileValidationError).reason).toBe('SIZE_EXCEEDED')
    expect(patchSpy).not.toHaveBeenCalled()
  })
})

describe('useMeetingRoomFileDeleteMutation', () => {
  it('삭제 성공(204) 시 roomDetail·roomFiles가 모두 invalidate되어 재조회된다', async () => {
    let files: unknown[] = [{ fileId: 10, originalName: 'room.jpg', extension: 'jpg', fileSize: 100 }]
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/1`, () =>
        HttpResponse.json({ meetingRoomId: 1, name: '대회의실', description: '설명', capacity: 10, isAvailable: true }),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/1/files`, () => HttpResponse.json(files)),
      http.delete(`${BASE_URL}/api/meeting-rooms/1/files/10`, () => {
        files = []
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useMeetingRoomDetailQuery(1),
        files: useMeetingRoomFilesQuery(1),
        mutation: useMeetingRoomFileDeleteMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.files.data).toHaveLength(1))

    result.current.mutation.mutate({ meetingRoomId: 1, fileId: 10 })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.files.data).toEqual([]))
  })
})
