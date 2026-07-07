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

/**
 * 게시글 첨부파일 업로드/삭제 mutation 훅(BOARD_FILE_UPLOAD/BOARD_FILE_DELETE, ROADMAP T13.2)의
 * 성공(204) 후 invalidate 동작 + 사전검증 차단을 검증한다.
 * departmentMutations.invalidate.test.tsx와 동일 관행: mock을 가로채지 않고 "성공 후 첨부 목록
 * 쿼리가 실제로 재조회되어 최신 값을 반영하는지"를 블랙박스로 확인한다.
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

/**
 * WHY: MSW(node)가 axios(XHR adapter, jsdom) 요청을 가로챌 때 내부적으로 undici 기반
 * FormData/File로 재구성하는데, jsdom File은 undici의 webidl 브랜드 체크를 통과하지 못해
 * multipart 파싱이 깨지는 테스트 인프라 한계가 있다(MSW+jsdom 알려진 상호운용 이슈).
 * 이 파일의 PATCH 핸들러들은 그래서 `request.formData()`를 호출하지 않고 응답(204)과 호출
 * 횟수만 관찰한다 — "part명이 단수 file인지"는 uploadBoardFile.test.ts(apiClient 모킹, 네트워크
 * 왕복 없음)에서 별도로 검증한다.
 */
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
    // 다중 part 일괄 전송(1회 요청) 대신 파일별 순차 PATCH(요청 2회)인지를 호출 횟수로 확인한다.
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
