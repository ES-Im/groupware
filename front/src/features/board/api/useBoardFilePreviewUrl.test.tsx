import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useBoardFilePreviewUrl } from './useBoardFilePreviewUrl'

/**
 * useBoardFilePreviewUrl(ROADMAP T11.2-b) 실동작 검증: BOARD_FILE_PREVIEW(GET
 * /api/boards/{boardId}/files/{fileId}/preview)를 blob으로 조회해 objectURL로 변환하고,
 * 언마운트/의존성 변경 시 revokeObjectURL을 호출하는지, boardId/fileId 미확정·조회 실패 시
 * 폴백 상태(objectUrl undefined)를 반환하는지 확인한다. shared/lib/useEmpFilePreview.test.tsx와
 * 동일한 시나리오 구성을 board 경로에 맞춰 복제했다.
 */

const PREVIEW_URL = (boardId: number, fileId: number) =>
  `${BASE_URL}/api/boards/${boardId}/files/${fileId}/preview`

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useBoardFilePreviewUrl', () => {
  it('boardId+fileId가 있으면 blob을 조회해 objectURL을 반환한다', async () => {
    server.use(
      http.get(PREVIEW_URL(1, 10), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url-1')

    const { result } = renderHook(() => useBoardFilePreviewUrl(1, 10))

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:mock-url-1'))
    expect(result.current.isError).toBe(false)
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
  })

  it('언마운트 시 revokeObjectURL을 호출해 objectURL을 해제한다', async () => {
    server.use(
      http.get(PREVIEW_URL(1, 10), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url-2')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const { result, unmount } = renderHook(() => useBoardFilePreviewUrl(1, 10))
    await waitFor(() => expect(result.current.objectUrl).toBe('blob:mock-url-2'))

    unmount()

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url-2')
  })

  it('의존성(boardId/fileId) 변경 시에도 이전 objectURL을 revoke한다', async () => {
    server.use(
      http.get(PREVIEW_URL(1, 10), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('first').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
      http.get(PREVIEW_URL(1, 20), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('second').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const { result, rerender } = renderHook(
      ({ boardId, fileId }: { boardId: number; fileId: number }) =>
        useBoardFilePreviewUrl(boardId, fileId),
      { initialProps: { boardId: 1, fileId: 10 } },
    )
    await waitFor(() => expect(result.current.objectUrl).toBe('blob:first'))

    rerender({ boardId: 1, fileId: 20 })

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:second'))
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:first')
  })

  it('의존성 변경 시 새 blob이 도착하기 전까지 objectUrl을 즉시 undefined로 리셋한다(깨진 URL 노출 방지)', async () => {
    let resolveSecondResponse: (() => void) | undefined
    const secondResponseGate = new Promise<void>((resolve) => {
      resolveSecondResponse = resolve
    })

    server.use(
      http.get(PREVIEW_URL(1, 10), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('first').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
      http.get(PREVIEW_URL(1, 20), async () => {
        // 두 번째 요청 응답을 테스트가 제어하는 시점까지 지연시켜, 그 사이의 objectUrl 상태를 관찰한다.
        await secondResponseGate
        return HttpResponse.arrayBuffer(new TextEncoder().encode('second').buffer, {
          headers: { 'Content-Type': 'image/png' },
        })
      }),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const { result, rerender } = renderHook(
      ({ boardId, fileId }: { boardId: number; fileId: number }) =>
        useBoardFilePreviewUrl(boardId, fileId),
      { initialProps: { boardId: 1, fileId: 10 } },
    )
    await waitFor(() => expect(result.current.objectUrl).toBe('blob:first'))

    rerender({ boardId: 1, fileId: 20 })

    // 새 blob이 아직 도착하지 않은 구간: 리셋 전 'blob:first'(이미 revoke된 URL)가 아니라
    // 즉시 undefined여야 한다 — 그래야 소비처가 깨진 이미지 대신 폴백을 보여준다.
    await waitFor(() => expect(result.current.objectUrl).toBeUndefined())
    expect(result.current.isLoading).toBe(true)

    resolveSecondResponse?.()

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:second'))
  })

  it('boardId가 미확정이면 조회하지 않고 objectUrl undefined를 반환한다', () => {
    const { result } = renderHook(() => useBoardFilePreviewUrl(undefined, 10))

    expect(result.current.objectUrl).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('fileId가 미확정이면 조회하지 않고 objectUrl undefined를 반환한다', () => {
    const { result } = renderHook(() => useBoardFilePreviewUrl(1, undefined))

    expect(result.current.objectUrl).toBeUndefined()
  })

  it('조회 실패(404 등) 시 isError=true, objectUrl undefined를 반환한다', async () => {
    server.use(
      http.get(PREVIEW_URL(1, 999), () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '파일을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    const { result } = renderHook(() => useBoardFilePreviewUrl(1, 999))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.objectUrl).toBeUndefined()
  })
})
