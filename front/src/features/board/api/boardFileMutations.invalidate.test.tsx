import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { BoardFileValidationError } from '../lib/fileValidation'
import type { BoardFileInfo } from '../model/board'
import { boardKeys } from '../model/queryKeys'
import { useBoardFileDeleteMutation } from './useBoardFileDeleteMutation'
import { useBoardFileUploadMutation } from './useBoardFileUploadMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

function makeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name)
}

function fileInfo(fileId: number, size = 100): BoardFileInfo {
  return { fileId, originalName: `file-${fileId}.pdf`, extension: 'pdf', fileSize: size }
}

function useFilesQuery(boardId: number) {
  return useQuery({
    queryKey: boardKeys.files(boardId),
    queryFn: async () => (await fetch(`${BASE_URL}/api/boards/${boardId}/files`)).json() as Promise<BoardFileInfo[]>,
  })
}

describe('게시글 첨부파일 mutation (BOARD_FILE_UPLOAD/BOARD_FILE_DELETE, T13.2)', () => {
  it('업로드(단수 file part) 성공(204) 시 boardKeys.files가 invalidate되어 목록이 재조회된다', async () => {
    let files: BoardFileInfo[] = []
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json(files)),
      http.patch(`${BASE_URL}/api/boards/1/files`, () => {
        patchSpy()
        files = [...files, fileInfo(files.length + 1)]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ list: useFilesQuery(1), mutation: useBoardFileUploadMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data).toEqual([]))

    result.current.mutation.mutate({ boardId: 1, files: [makeFile('a.pdf', 100)], existingFiles: [] })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data).toHaveLength(1))
    expect(patchSpy).toHaveBeenCalledTimes(1)
  })

  it('다중 파일 업로드는 한 번의 배치 요청이 아니라 파일별 개별 PATCH 2회로 처리된다(§열린항목3 순차 PATCH 기본안)', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.patch(`${BASE_URL}/api/boards/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useBoardFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({
      boardId: 1,
      files: [makeFile('a.pdf', 100), makeFile('b.png', 200)],
      existingFiles: [],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(patchSpy).toHaveBeenCalledTimes(2)
  })

  it('사전검증 위반(11개째 파일) 시 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/boards/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()
    const existingFiles = Array.from({ length: 10 }, (_, i) => fileInfo(i + 1))

    const { result } = renderHook(() => useBoardFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ boardId: 1, files: [makeFile('a.pdf', 100)], existingFiles })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(BoardFileValidationError)
    expect((result.current.error as BoardFileValidationError).reason).toBe('COUNT_EXCEEDED')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('사전검증 위반(총량 10MB 초과) 시 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/boards/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useBoardFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({
      boardId: 1,
      files: [makeFile('a.pdf', 11 * 1024 * 1024)],
      existingFiles: [],
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as BoardFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('사전검증 위반(비허용 확장자) 시 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/boards/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useBoardFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ boardId: 1, files: [makeFile('virus.exe', 100)], existingFiles: [] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error as BoardFileValidationError
    expect(error.reason).toBe('EXTENSION_NOT_ALLOWED')
    expect(error.code).toBe('FILE_003')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('삭제(BOARD_FILE_DELETE) 성공(204) 시 boardKeys.files가 invalidate되어 목록이 재조회된다', async () => {
    let files: BoardFileInfo[] = [fileInfo(10)]
    server.use(
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json(files)),
      http.delete(`${BASE_URL}/api/boards/1/files/10`, () => {
        files = []
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({ list: useFilesQuery(1), mutation: useBoardFileDeleteMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data).toHaveLength(1))

    result.current.mutation.mutate({ boardId: 1, fileId: 10 })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data).toEqual([]))
  })
})
