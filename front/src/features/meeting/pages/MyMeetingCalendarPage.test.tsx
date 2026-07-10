import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MyMeetingCalendarPage } from './MyMeetingCalendarPage'

/**
 * MyMeetingCalendarPage(F800, ROADMAP T1.4, P1) 회귀 방지 테스트.
 *
 * getMyMeetingReservationsCalendar.test.ts/useMyMeetingReservationsCalendarQuery.test.tsx가
 * 이미 확립한 MSW 엔드포인트(GET /api/meetings/my/reservations/calendar)를 그대로 재사용한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

function makeItem(meetingId: number, title: string, isCanceled = false) {
  return {
    meetingId,
    meetingRoomId: 3,
    meetingRoomName: '대회의실',
    reserverId: 1,
    reserverDeptName: '개발팀',
    reserverEmpName: '홍길동',
    title,
    // FullCalendar 초기 뷰(dayGridMonth)가 현재월(테스트 실행 시점 실제 시스템 날짜)을 보여주므로,
    // 이벤트가 초기 뷰에 실제로 렌더되도록 오늘 날짜로 고정한다(다른 달로 고정하면 초기 뷰에
    // 렌더되지 않아 findByText가 타임아웃난다).
    meetingDate: dayjs().format('YYYY-MM-DD'),
    startAt: '10:00:00',
    endAt: '11:00:00',
    isCanceled,
    participantCount: 2,
  }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MyMeetingCalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MyMeetingCalendarPage - 정상 렌더', () => {
  it('내 예약 목록이 캘린더 이벤트로 반영된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/my/reservations/calendar`, () =>
        HttpResponse.json([makeItem(10, '주간 회의')]),
      ),
    )

    renderPage()

    expect(await screen.findByText(/대회의실 · 주간 회의 · 10:00:00~11:00:00/)).toBeInTheDocument()
  })

  it('취소건(isCanceled=true)은 opacity-50/line-through 클래스로 시각 구분된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/my/reservations/calendar`, () =>
        HttpResponse.json([makeItem(11, '취소된 회의', true)]),
      ),
    )

    renderPage()

    const eventEl = await screen.findByText(/취소된 회의/)
    const eventRoot = eventEl.closest('.fc-event')
    expect(eventRoot).toHaveClass('opacity-50')
    expect(eventRoot).toHaveClass('line-through')
  })
})

describe('MyMeetingCalendarPage - 에러 상태', () => {
  it('조회 실패 시 handleApiError를 통해 에러 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/my/reservations/calendar`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('MyMeetingCalendarPage - 라우팅', () => {
  it('"회의 예약하기" 클릭 시 /meetings/new로 이동한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/my/reservations/calendar`, () => HttpResponse.json([])),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '회의 예약하기' }))

    expect(mockNavigate).toHaveBeenCalledWith('/meetings/new')
  })

  it('이벤트 클릭 시 /meetings/{meetingId}로 이동한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/my/reservations/calendar`, () =>
        HttpResponse.json([makeItem(10, '주간 회의')]),
      ),
    )

    renderPage()

    const eventEl = await screen.findByText(/주간 회의/)
    eventEl.click()

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/meetings/10'))
  })
})
