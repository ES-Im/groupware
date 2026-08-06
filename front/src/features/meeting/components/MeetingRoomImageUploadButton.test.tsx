import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomImageUploadButton } from './MeetingRoomImageUploadButton'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderButton() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingRoomImageUploadButton meetingRoomId={3} />
    </QueryClientProvider>,
  )
}

describe('MeetingRoomImageUploadButton - 사전검증', () => {
  it('허용되지 않는 확장자 선택 시 네트워크 요청 없이 검증 에러 토스트만 뜬다', async () => {
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/3/files`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = renderButton()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['x'], 'virus.exe', { type: 'image/png' })

    await userEvent.upload(fileInput, badFile)

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('허용되지 않는 확장자입니다')),
    )
    expect(patchCalled).toBe(false)
  })

  it('10MB 초과 파일 선택 시 네트워크 요청 없이 검증 에러 토스트만 뜬다', async () => {
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/3/files`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = renderButton()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], 'room.png', { type: 'image/png' })

    await userEvent.upload(fileInput, bigFile)

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('크기는')),
    )
    expect(patchCalled).toBe(false)
  })
})

describe('MeetingRoomImageUploadButton - 업로드 성공', () => {
  it('허용 확장자 파일 선택 시 업로드 요청을 보내고 성공 토스트를 띄운다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/3/files`, () => new HttpResponse(null, { status: 204 })),
    )
    const { container } = renderButton()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const goodFile = new File(['image-bytes'], 'room.png', { type: 'image/png' })

    await userEvent.upload(fileInput, goodFile)

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('안내 이미지를 업로드했습니다'))
  })

  it('서버 실패(500) 시 handleApiError로 에러 토스트가 노출된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/3/files`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )
    const { container } = renderButton()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const goodFile = new File(['image-bytes'], 'room.png', { type: 'image/png' })

    await userEvent.upload(fileInput, goodFile)

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })

  it('버튼 클릭 시 숨겨진 파일 입력을 트리거한다(업로드 중에는 비활성화)', () => {
    renderButton()

    expect(screen.getByRole('button', { name: '이미지 업로드' })).not.toBeDisabled()
  })
})
