import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useMeetingRoomFilePreviewUrl } from './useMeetingRoomFilePreviewUrl'

/**
 * useMeetingRoomFilePreviewUrl(ROADMAP T2.2) 실동작 검증.
 * board useBoardFilePreviewUrl.test.tsx와 동일한 시나리오 구성을 회의실 경로에 맞춰 복제했다.
 */
const PREVIEW_URL = (meetingRoomId: number, fileId: number) =>
  `${BASE_URL}/api/meeting-rooms/${meetingRoomId}/files/${fileId}/preview`

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMeetingRoomFilePreviewUrl', () => {
  it('meetingRoomId+fileId가 있으면 blob을 조회해 objectURL을 반환한다', async () => {
    server.use(
      http.get(PREVIEW_URL(3, 10), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url-1')

    const { result } = renderHook(() => useMeetingRoomFilePreviewUrl(3, 10))

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:mock-url-1'))
    expect(result.current.isError).toBe(false)
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
  })

  it('언마운트 시 revokeObjectURL을 호출해 objectURL을 해제한다', async () => {
    server.use(
      http.get(PREVIEW_URL(3, 10), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url-2')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const { result, unmount } = renderHook(() => useMeetingRoomFilePreviewUrl(3, 10))
    await waitFor(() => expect(result.current.objectUrl).toBe('blob:mock-url-2'))

    unmount()

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url-2')
  })

  it('meetingRoomId가 미확정이면 조회하지 않고 objectUrl undefined를 반환한다', () => {
    const { result } = renderHook(() => useMeetingRoomFilePreviewUrl(undefined, 10))

    expect(result.current.objectUrl).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('fileId가 미확정이면 조회하지 않고 objectUrl undefined를 반환한다', () => {
    const { result } = renderHook(() => useMeetingRoomFilePreviewUrl(3, undefined))

    expect(result.current.objectUrl).toBeUndefined()
  })

  it('조회 실패(404 등) 시 isError=true, objectUrl undefined를 반환한다', async () => {
    server.use(
      http.get(PREVIEW_URL(3, 999), () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '파일을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    const { result } = renderHook(() => useMeetingRoomFilePreviewUrl(3, 999))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.objectUrl).toBeUndefined()
  })
})
