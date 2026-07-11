import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpFileUploadButton } from './EmpFileUploadButton'

/**
 * EmpFileUploadButton(MyInfoPage 전용, SignatureCard/EmpFileManagementPanel 공유) 검증.
 * MeetingRoomImageUploadButton.test.tsx의 사전검증/업로드 성공 패턴을 그대로 복제한다.
 *
 * 성공 경로 PATCH 핸들러는 empFileMutations.invalidate.test.tsx와 동일 이유로
 * request.formData()를 호출하지 않고 응답(204)만 반환한다(MSW+jsdom FormData/File 상호운용 한계 우회).
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderButton(empId: number | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmpFileUploadButton empId={empId} fileType="SIGNATURE" label="이미지 첨부" />
    </QueryClientProvider>,
  )
}

describe('EmpFileUploadButton - empId 미확정', () => {
  it('empId가 undefined면 버튼과 파일 입력이 모두 비활성화된다', () => {
    const { container } = renderButton(undefined)

    expect(screen.getByRole('button', { name: '이미지 첨부' })).toBeDisabled()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeDisabled()
  })
})

describe('EmpFileUploadButton - 사전검증', () => {
  it('허용되지 않는 확장자 선택 시 네트워크 요청 없이 검증 에러 토스트만 뜬다', async () => {
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/employees/1/files`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = renderButton(1)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['x'], 'virus.exe', { type: 'image/png' })

    await userEvent.upload(fileInput, badFile)

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('허용되지 않는 확장자입니다')),
    )
    expect(patchCalled).toBe(false)
  })

  it('5MB 초과 파일 선택 시 네트워크 요청 없이 검증 에러 토스트만 뜬다', async () => {
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/employees/1/files`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = renderButton(1)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'sig.png', { type: 'image/png' })

    await userEvent.upload(fileInput, bigFile)

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('크기는')))
    expect(patchCalled).toBe(false)
  })
})

describe('EmpFileUploadButton - 업로드 성공', () => {
  it('허용 확장자 파일 선택 시 empId/fileType 쿼리로 PATCH를 요청하고 성공 토스트를 띄운다', async () => {
    let requestedFileType: string | null = null
    server.use(
      http.patch(`${BASE_URL}/api/employees/1/files`, ({ request }) => {
        requestedFileType = new URL(request.url).searchParams.get('fileType')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = renderButton(1)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const goodFile = new File(['image-bytes'], 'sig.png', { type: 'image/png' })

    await userEvent.upload(fileInput, goodFile)

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('파일을 업로드했습니다'))
    expect(requestedFileType).toBe('SIGNATURE')
  })

  it('서버 실패(500) 시 handleApiError로 에러 토스트가 노출된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/1/files`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )
    const { container } = renderButton(1)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const goodFile = new File(['image-bytes'], 'sig.png', { type: 'image/png' })

    await userEvent.upload(fileInput, goodFile)

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})
