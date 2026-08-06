import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomImageGallery } from './MeetingRoomImageGallery'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.restoreAllMocks()
})

function renderGallery(meetingRoomId = 3, showDeleteAction?: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingRoomImageGallery meetingRoomId={meetingRoomId} showDeleteAction={showDeleteAction} />
    </QueryClientProvider>,
  )
}

const FILE = { fileId: 10, originalName: 'a.png', extension: 'png', fileSize: 1024 }

describe('MeetingRoomImageGallery - 로딩/빈 상태', () => {
  it('빈 배열이면 "등록된 안내 이미지가 없습니다."를 노출한다', async () => {
    server.use(http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([])))

    renderGallery()

    expect(await screen.findByText('등록된 안내 이미지가 없습니다.')).toBeInTheDocument()
  })
})

describe('MeetingRoomImageGallery - 에러 상태', () => {
  it('404 응답 시 "회의실을 찾을 수 없습니다."를 노출하고 토스트는 띄우지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/999/files`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '회의실을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    renderGallery(999)

    expect(await screen.findByText('회의실을 찾을 수 없습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('그 외 에러(500)는 "안내 이미지를 불러오지 못했습니다."와 토스트를 함께 노출한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderGallery()

    expect(await screen.findByText('안내 이미지를 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('MeetingRoomImageGallery - 정상 렌더/다운로드', () => {
  it('파일 목록을 렌더하고, 미리보기 blob을 조회해 이미지를 보여준다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([FILE])),
      http.get(`${BASE_URL}/api/meeting-rooms/3/files/10/preview`, () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    renderGallery()

    const img = await screen.findByAltText('a.png')
    expect(img).toHaveAttribute('src', 'blob:mock-preview')
  })

  it('다운로드 버튼 클릭 시 다운로드 엔드포인트를 blob으로 호출한다', async () => {
    let downloadCalled = false
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([FILE])),
      http.get(`${BASE_URL}/api/meeting-rooms/3/files/10/preview`, () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/3/files/10/download`, () => {
        downloadCalled = true
        return HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        })
      }),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const user = userEvent.setup()
    renderGallery()

    await user.click(await screen.findByRole('button', { name: /a\.png/ }))

    await waitFor(() => expect(downloadCalled).toBe(true))
  })
})

describe('MeetingRoomImageGallery - 삭제 액션 opt-in', () => {
  it('showDeleteAction 미지정(false)이면 삭제 버튼이 렌더되지 않는다(P4 열람 화면)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([FILE])),
      http.get(`${BASE_URL}/api/meeting-rooms/3/files/10/preview`, () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')

    renderGallery(3, false)

    await screen.findByAltText('a.png')
    expect(screen.queryByRole('button', { name: 'a.png 삭제' })).not.toBeInTheDocument()
  })

  it('showDeleteAction=true면 확인 다이얼로그를 거쳐 삭제 요청을 보내고 성공 토스트를 띄운다(P7 관리자 상세)', async () => {
    let deleteCalled = false
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([FILE])),
      http.get(`${BASE_URL}/api/meeting-rooms/3/files/10/preview`, () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
      http.delete(`${BASE_URL}/api/meeting-rooms/3/files/10`, () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const user = userEvent.setup()
    renderGallery(3, true)

    await screen.findByAltText('a.png')
    await user.click(screen.getByRole('button', { name: 'a.png 삭제' }))

    const confirmButton = await screen.findByRole('button', { name: '삭제' })
    await user.click(confirmButton)

    await waitFor(() => expect(deleteCalled).toBe(true))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('안내 이미지를 삭제했습니다'))
  })
})
