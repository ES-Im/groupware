import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useEducationFilePreviewUrl } from './useEducationFilePreviewUrl'

const PREVIEW_URL = (educationId: number, fileId: number) =>
  `${BASE_URL}/api/educations/${educationId}/files/${fileId}/preview`

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useEducationFilePreviewUrl', () => {
  it('educationId+fileId가 있으면 blob을 조회해 objectURL을 반환한다', async () => {
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

    const { result } = renderHook(() => useEducationFilePreviewUrl(1, 10))

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

    const { result, unmount } = renderHook(() => useEducationFilePreviewUrl(1, 10))
    await waitFor(() => expect(result.current.objectUrl).toBe('blob:mock-url-2'))

    unmount()

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url-2')
  })

  it('의존성(educationId/fileId) 변경 시에도 이전 objectURL을 revoke한다', async () => {
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
      ({ educationId, fileId }: { educationId: number; fileId: number }) =>
        useEducationFilePreviewUrl(educationId, fileId),
      { initialProps: { educationId: 1, fileId: 10 } },
    )
    await waitFor(() => expect(result.current.objectUrl).toBe('blob:first'))

    rerender({ educationId: 1, fileId: 20 })

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
        await secondResponseGate
        return HttpResponse.arrayBuffer(new TextEncoder().encode('second').buffer, {
          headers: { 'Content-Type': 'image/png' },
        })
      }),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const { result, rerender } = renderHook(
      ({ educationId, fileId }: { educationId: number; fileId: number }) =>
        useEducationFilePreviewUrl(educationId, fileId),
      { initialProps: { educationId: 1, fileId: 10 } },
    )
    await waitFor(() => expect(result.current.objectUrl).toBe('blob:first'))

    rerender({ educationId: 1, fileId: 20 })

    await waitFor(() => expect(result.current.objectUrl).toBeUndefined())
    expect(result.current.isLoading).toBe(true)

    resolveSecondResponse?.()

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:second'))
  })

  it('educationId가 미확정이면 조회하지 않고 objectUrl undefined를 반환한다', () => {
    const { result } = renderHook(() => useEducationFilePreviewUrl(undefined, 10))

    expect(result.current.objectUrl).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('fileId가 미확정이면 조회하지 않고 objectUrl undefined를 반환한다', () => {
    const { result } = renderHook(() => useEducationFilePreviewUrl(1, undefined))

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

    const { result } = renderHook(() => useEducationFilePreviewUrl(1, 999))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.objectUrl).toBeUndefined()
  })
})
