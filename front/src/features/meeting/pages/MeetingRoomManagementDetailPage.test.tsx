import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomManagementDetailPage } from './MeetingRoomManagementDetailPage'

/**
 * MeetingRoomManagementDetailPage(F813/F815/F816/F814, ROADMAP(MEETING-ROOMS) T7.2) 회귀 방지
 * 테스트.
 *
 * M2 공유 read 블록(MeetingRoomInfoPanel/MeetingRoomImageGallery/MeetingRoomReservationCalendarBlock)
 * 자체의 로딩/에러/정상 분기는 각 컴포넌트 테스트가 이미 다루므로, 이 페이지 테스트는 P7 전용
 * 배선 지점만 다룬다:
 * - route param 유효성 가드(비-10진 양의 정수) + 404 시 not-found UX.
 * - "정보 수정" 버튼/활성 토글 버튼은 상세 데이터가 도착한 뒤에만 노출된다.
 * - "정보 수정" 클릭 시 MeetingRoomUpdateDialog가 열린다.
 * - MeetingRoomImageGallery는 이 페이지에서 `showDeleteAction=true`로 배선되어 항목별 삭제
 *   버튼이 노출된다(P4 열람 화면과 달리 opt-in이 켜짐).
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function mockRoomDetail(meetingRoomId: number, overrides: Partial<Record<string, unknown>> = {}) {
  server.use(
    http.get(`${BASE_URL}/api/meeting-rooms/${meetingRoomId}`, () =>
      HttpResponse.json({
        meetingRoomId,
        name: '대회의실',
        description: '층별 대형 회의실',
        capacity: 10,
        isAvailable: true,
        ...overrides,
      }),
    ),
    http.get(`${BASE_URL}/api/meeting-rooms/${meetingRoomId}/files`, () =>
      HttpResponse.json([{ fileId: 1, originalName: 'room.jpg', extension: 'jpg', fileSize: 100 }]),
    ),
    http.get(`${BASE_URL}/api/meeting-rooms/${meetingRoomId}/reservations/calendar`, () =>
      HttpResponse.json([]),
    ),
    http.get(`${BASE_URL}/api/meeting-rooms/${meetingRoomId}/files/1/preview`, () =>
      HttpResponse.arrayBuffer(new TextEncoder().encode('fake-image-bytes').buffer, {
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    ),
  )
}

function renderPage(meetingRoomIdParam: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/meeting-rooms/management/${meetingRoomIdParam}`]}>
        <Routes>
          <Route
            path="/meeting-rooms/management/:meetingRoomId"
            element={<MeetingRoomManagementDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MeetingRoomManagementDetailPage - route param 가드', () => {
  it('비-10진 양의 정수 파라미터(예: 16진수 표기)면 즉시 not-found 문구를 렌더한다', () => {
    renderPage('0x10')

    expect(screen.getByText('회의실을 찾을 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '정보 수정' })).not.toBeInTheDocument()
  })

  it('404 응답이면 not-found 문구를 렌더하고 관리 액션 버튼을 노출하지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/999`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '회의실을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    renderPage('999')

    expect(await screen.findByText('회의실을 찾을 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '정보 수정' })).not.toBeInTheDocument()
  })
})

describe('MeetingRoomManagementDetailPage - 정상 렌더/관리 액션', () => {
  it('상세 데이터 도착 후 "정보 수정" 버튼과 활성 토글 버튼이 노출된다', async () => {
    mockRoomDetail(1)

    renderPage('1')

    expect(await screen.findByRole('button', { name: '정보 수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비활성화' })).toBeInTheDocument()
  })

  it('"정보 수정" 클릭 시 MeetingRoomUpdateDialog(F813)가 열리고 현재 값으로 프리필된다', async () => {
    mockRoomDetail(1)

    const user = userEvent.setup()
    renderPage('1')

    await user.click(await screen.findByRole('button', { name: '정보 수정' }))

    expect(await screen.findByText('회의실 정보 수정')).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toHaveValue('대회의실')
  })

  it('MeetingRoomImageGallery가 showDeleteAction=true로 배선되어 항목별 삭제 버튼이 노출된다', async () => {
    mockRoomDetail(1)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    renderPage('1')

    expect(await screen.findByRole('button', { name: 'room.jpg 삭제' })).toBeInTheDocument()
  })
})
