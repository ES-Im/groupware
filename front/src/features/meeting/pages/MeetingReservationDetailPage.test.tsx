import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingReservationDetailPage } from './MeetingReservationDetailPage'

/**
 * MeetingReservationDetailPage(F801/F804/F805/F806, ROADMAP T4.3-a~c, P3) 회귀 방지 테스트.
 * 각 다이얼로그(수정/참여자교체/취소)는 개별 테스트에서 이미 검증되었으므로, 여기서는 조립 페이지
 * 책임(canManageReservation 게이팅에 따른 액션 영역 노출/은닉, 라우트 파라미터 가드, not-found/에러)만
 * 확인한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function meFixture(empId: number) {
  return {
    empBasicInfo: {
      empId,
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

function makeDetail(overrides: Record<string, unknown> = {}) {
  return {
    meetingId: 10,
    meetingRoomId: 3,
    meetingRoomName: '대회의실',
    reserverId: 7,
    reserverDeptName: '개발팀',
    reserverEmpName: '홍길동',
    title: '주간 회의',
    meetingDate: '2026-07-15',
    startAt: '10:00:00',
    endAt: '11:00:00',
    isCanceled: false,
    participantCount: 1,
    participants: [{ empId: 101, deptName: '개발팀', empName: '김철수' }],
    ...overrides,
  }
}

function renderDetail(meetingId: string | number = 10) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/meetings/${meetingId}`]}>
        <Routes>
          <Route path="/meetings/:meetingId" element={<MeetingReservationDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MeetingReservationDetailPage - 정상 렌더', () => {
  it('제목/회의실/예약자/일시/참여자를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(makeDetail())),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    renderDetail()

    expect(await screen.findByText('주간 회의')).toBeInTheDocument()
    expect(screen.getByText('대회의실')).toBeInTheDocument()
    expect(screen.getByText('예약자 개발팀 · 홍길동')).toBeInTheDocument()
    expect(screen.getByText('2026-07-15 10:00 ~ 11:00')).toBeInTheDocument()
    expect(screen.getByText('개발팀 · 김철수')).toBeInTheDocument()
    expect(screen.getByText('예약중')).toBeInTheDocument()
  })

  it('취소된 예약은 "취소됨" 배지를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(makeDetail({ isCanceled: true }))),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    renderDetail()

    expect(await screen.findByText('취소됨')).toBeInTheDocument()
  })
})

describe('MeetingReservationDetailPage - canManageReservation 게이팅', () => {
  it('예약자 본인 + 미취소 + 회의일이 내일 이후면 액션 3개(수정/참여자 교체/예약 취소)가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(makeDetail({ reserverId: 7 }))),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(7))),
    )

    renderDetail()

    expect(await screen.findByRole('button', { name: '예약 정보 수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '참여자 교체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '예약 취소' })).toBeInTheDocument()
  })

  it('예약자 본인이 아니면(FACILITY 등 조회 전용 진입) 액션이 전혀 노출되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(makeDetail({ reserverId: 7 }))),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    renderDetail()

    await screen.findByText('주간 회의')
    expect(screen.queryByRole('button', { name: '예약 정보 수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '참여자 교체' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '예약 취소' })).not.toBeInTheDocument()
  })

  it('이미 취소된 예약이면 예약자 본인이어도 액션이 노출되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(makeDetail({ reserverId: 7, isCanceled: true }))),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(7))),
    )

    renderDetail()

    await screen.findByText('취소됨')
    expect(screen.queryByRole('button', { name: '예약 정보 수정' })).not.toBeInTheDocument()
  })
})

describe('MeetingReservationDetailPage - 참여자 없음', () => {
  it('참여자가 없으면 "참여자가 없습니다."를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () =>
        HttpResponse.json(makeDetail({ participants: [], participantCount: 0 })),
      ),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    renderDetail()

    expect(await screen.findByText('참여자가 없습니다.')).toBeInTheDocument()
  })
})

describe('MeetingReservationDetailPage - 라우트 파라미터 가드/에러', () => {
  it('meetingId가 순수 10진 양의 정수가 아니면 즉시 not-found를 렌더한다', () => {
    renderDetail('-1')

    expect(screen.getByText('예약을 찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('404 응답 시 "예약을 찾을 수 없습니다."를 렌더하고 토스트는 띄우지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/999`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '예약을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    renderDetail(999)

    expect(await screen.findByText('예약을 찾을 수 없습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('그 외 에러(500)는 에러 문구와 토스트를 함께 노출한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    renderDetail()

    expect(await screen.findByText('예약 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})
