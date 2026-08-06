import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpFileValidationError } from '../lib/empFileValidation'
import { useEmpFileActivateMutation } from './useEmpFileActivateMutation'
import { useEmpFileDeleteMutation } from './useEmpFileDeleteMutation'
import { useEmpFileUploadMutation } from './useEmpFileUploadMutation'
import { useFilesInfosQuery } from './useFilesInfosQuery'
import { useMeQuery } from './useMeQuery'

const ME_RESPONSE = {
  empBasicInfo: { empId: 1, empNo: '202607001', name: '홍길동', loginId: 'test1234', email: 'a@a.com', extensionNo: '000-0000' },
  activeFiles: [] as unknown[],
  currentDepts: [] as unknown[],
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

function makeFile(name: string, size = 100): File {
  return new File([new Uint8Array(size)], name)
}

describe('useEmpFileUploadMutation', () => {
  it('업로드 성공(204) 시 me·filesInfos가 모두 invalidate되어 재조회된다', async () => {
    let activeFiles: unknown[] = []
    let filesInfos: unknown[] = []
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json({ ...ME_RESPONSE, activeFiles })),
      http.get(`${BASE_URL}/api/employees/me/files`, () => HttpResponse.json(filesInfos)),
      http.patch(`${BASE_URL}/api/employees/1/files`, () => {
        const uploaded = { file: { fileId: 9, originalName: 'sig.png', extension: 'png', fileSize: 100 }, type: 'SIGNATURE', isActive: true }
        activeFiles = [uploaded]
        filesInfos = [uploaded]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        me: useMeQuery(),
        filesInfos: useFilesInfosQuery(true),
        mutation: useEmpFileUploadMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.me.data?.activeFiles).toEqual([]))

    result.current.mutation.mutate({ empId: 1, fileType: 'SIGNATURE', file: makeFile('sig.png') })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.me.data?.activeFiles).toHaveLength(1))
    await waitFor(() => expect(result.current.filesInfos.data).toHaveLength(1))
  })

  it('사전검증 위반(비허용 확장자)이면 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/employees/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useEmpFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ empId: 1, fileType: 'SIGNATURE', file: makeFile('virus.exe') })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error as EmpFileValidationError
    expect(error).toBeInstanceOf(EmpFileValidationError)
    expect(error.reason).toBe('EXTENSION_NOT_ALLOWED')
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('사전검증 위반(5MB 초과)이면 네트워크 요청 없이 즉시 차단된다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/employees/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useEmpFileUploadMutation(), { wrapper: Wrapper })

    result.current.mutate({ empId: 1, fileType: 'PROFILE_PICTURE', file: makeFile('p.png', 6 * 1024 * 1024) })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as EmpFileValidationError).reason).toBe('SIZE_EXCEEDED')
    expect(patchSpy).not.toHaveBeenCalled()
  })
})

describe('useEmpFileActivateMutation', () => {
  it('활성화 성공(204) 시 me·filesInfos가 모두 invalidate되어 재조회된다', async () => {
    let filesInfos: unknown[] = [
      { file: { fileId: 2, originalName: 'old.png', extension: 'png', fileSize: 100 }, type: 'PROFILE_PICTURE', isActive: false },
    ]
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(ME_RESPONSE)),
      http.get(`${BASE_URL}/api/employees/me/files`, () => HttpResponse.json(filesInfos)),
      http.patch(`${BASE_URL}/api/employees/me/files/2/status`, () => {
        filesInfos = [{ ...(filesInfos[0] as Record<string, unknown>), isActive: true }]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        filesInfos: useFilesInfosQuery(true),
        mutation: useEmpFileActivateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.filesInfos.data).toHaveLength(1))

    result.current.mutation.mutate({ fileId: 2, isForActivate: true })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() =>
      expect((result.current.filesInfos.data?.[0] as { isActive: boolean }).isActive).toBe(true),
    )
  })
})

describe('useEmpFileDeleteMutation', () => {
  it('삭제 성공(204) 시 me·filesInfos가 모두 invalidate되어 재조회된다', async () => {
    let filesInfos: unknown[] = [
      { file: { fileId: 5, originalName: 'old.png', extension: 'png', fileSize: 100 }, type: 'PROFILE_PICTURE', isActive: false },
    ]
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(ME_RESPONSE)),
      http.get(`${BASE_URL}/api/employees/me/files`, () => HttpResponse.json(filesInfos)),
      http.delete(`${BASE_URL}/api/employees/1/files/5`, () => {
        filesInfos = []
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        filesInfos: useFilesInfosQuery(true),
        mutation: useEmpFileDeleteMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.filesInfos.data).toHaveLength(1))

    result.current.mutation.mutate({ empId: 1, fileId: 5 })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.filesInfos.data).toEqual([]))
  })
})
