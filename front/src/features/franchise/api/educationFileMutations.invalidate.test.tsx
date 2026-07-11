import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EducationFileValidationError } from '../lib/educationFileValidation'
import type { FranchiseEducationDetail, FranchiseEducationFileInfo } from '../model/franchise'
import { useEducationFileDeleteMutation } from './useEducationFileDeleteMutation'
import { useEducationFileUploadMutation } from './useEducationFileUploadMutation'
import { useFranchiseEducationDetailQuery } from './useFranchiseEducationDetailQuery'

/**
 * 교육 첨부파일 업로드/삭제 mutation 훅(EDUCATION_FILE_UPLOAD/EDUCATION_FILE_DELETE)의
 * 성공(204) 후 invalidate 동작 + 사전검증 차단을 검증한다.
 * board boardFileMutations.invalidate.test.tsx와 동일 관행 — mock을 가로채지 않고 "성공 후
 * 교육 상세 쿼리(fileListInfoList)가 실제로 재조회되어 최신 값을 반영하는지"를 블랙박스로
 * 확인한다. franchise는 board/meeting과 달리 첨부 목록이 상세 응답(fileListInfoList)에
 * 포함되므로, useFranchiseEducationDetailQuery로 관찰한다.
 */

/**
 * WHY: MSW(node)가 axios(XHR adapter, jsdom) 요청을 가로챌 때 내부적으로 undici 기반
 * FormData/File로 재구성하는데, jsdom File은 undici의 webidl 브랜드 체크를 통과하지 못해
 * multipart 파싱이 깨지는 테스트 인프라 한계가 있다(board와 동일 근거). 이 파일의 PATCH
 * 핸들러들은 그래서 request.formData()를 호출하지 않고 응답(204)과 호출 횟수만 관찰한다 —
 * "part명이 단수 file인지"는 uploadEducationFile.test.ts(apiClient 모킹)에서 별도 검증한다.
 */
function makeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name)
}

function fileInfo(fileId: number, size = 100): FranchiseEducationFileInfo {
  return { fileId, originalName: `file-${fileId}.pdf`, extension: 'pdf', fileSize: size }
}

function detail(fileListInfoList: FranchiseEducationFileInfo[] | null): FranchiseEducationDetail {
  return {
    id: 1,
    date: '2026-05-01',
    startAt: '10:00:00',
    place: '본사 3층 강당',
    title: '신규 가맹점 오리엔테이션',
    content: '가맹 운영 기본 교육입니다',
    appliedCount: 0,
    capacity: 20,
    remainingCapacity: 20,
    isActive: true,
    fileListInfoList,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

describe('교육 첨부파일 mutation (EDUCATION_FILE_UPLOAD/EDUCATION_FILE_DELETE)', () => {
  it('업로드(단수 file part) 성공(204) 시 franchiseKeys.education.detail이 invalidate되어 목록이 재조회된다', async () => {
    let files: FranchiseEducationFileInfo[] = []
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1`, () => HttpResponse.json(detail(files))),
      http.patch(`${BASE_URL}/api/educations/1/files`, () => {
        patchSpy()
        files = [...files, fileInfo(files.length + 1)]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detailQuery: useFranchiseEducationDetailQuery(1),
        mutation: useEducationFileUploadMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detailQuery.data?.fileListInfoList).toEqual([]))

    result.current.mutation.mutate({
      educationId: 1,
      files: [makeFile('a.pdf', 100)],
      existingFiles: [],
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() =>
      expect(result.current.detailQuery.data?.fileListInfoList).toHaveLength(1),
    )
    expect(patchSpy).toHaveBeenCalledTimes(1)
  })

  it('다중 파일 업로드는 한 번의 배치 요청이 아니라 파일별 개별 PATCH 2회로 처리된다(순차 PATCH 기본안)', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1`, () => HttpResponse.json(detail([]))),
      http.patch(`${BASE_URL}/api/educations/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useEducationFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({
      educationId: 1,
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
      http.patch(`${BASE_URL}/api/educations/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()
    const existingFiles = Array.from({ length: 10 }, (_, i) => fileInfo(i + 1))

    const { result } = renderHook(() => useEducationFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ educationId: 1, files: [makeFile('a.pdf', 100)], existingFiles })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(EducationFileValidationError)
    expect((result.current.error as EducationFileValidationError).reason).toBe('COUNT_EXCEEDED')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('사전검증 위반(총량 10MB 초과) 시 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/educations/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useEducationFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({
      educationId: 1,
      files: [makeFile('a.pdf', 11 * 1024 * 1024)],
      existingFiles: [],
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as EducationFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('사전검증 위반(비허용 확장자) 시 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/educations/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useEducationFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ educationId: 1, files: [makeFile('virus.exe', 100)], existingFiles: [] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error as EducationFileValidationError
    expect(error.reason).toBe('EXTENSION_NOT_ALLOWED')
    expect(error.code).toBe('FILE_003')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('삭제(EDUCATION_FILE_DELETE) 성공(204) 시 franchiseKeys.education.detail이 invalidate되어 목록이 재조회된다', async () => {
    let files: FranchiseEducationFileInfo[] = [fileInfo(10)]
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1`, () => HttpResponse.json(detail(files))),
      http.delete(`${BASE_URL}/api/educations/1/files/10`, () => {
        files = []
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detailQuery: useFranchiseEducationDetailQuery(1),
        mutation: useEducationFileDeleteMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() =>
      expect(result.current.detailQuery.data?.fileListInfoList).toHaveLength(1),
    )

    result.current.mutation.mutate({ educationId: 1, fileId: 10 })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detailQuery.data?.fileListInfoList).toEqual([]))
  })
})
