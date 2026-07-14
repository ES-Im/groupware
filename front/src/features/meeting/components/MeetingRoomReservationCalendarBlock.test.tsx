import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomReservationCalendarBlock } from './MeetingRoomReservationCalendarBlock'

/**
 * MeetingRoomReservationCalendarBlock(F809, ROADMAP T2.4-b) 회귀 방지 테스트.
 * meetingId가 응답에 없어(설계 의도) 상세로 이동시키지는 않지만, 이벤트를 클릭하면 카드 하단에
 * 그 예약 요약(예약자·시간·참여자)이 인라인으로 나타나는지 확인한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeItem(reserverEmpName: string) {
  return {
    reserverDeptName: '개발팀',
    reserverEmpName,
    participantCount: 2,
    meetingDate: dayjs().format('YYYY-MM-DD'),
    startAt: '10:00:00',
    endAt: '11:00:00',
  }
}

function renderBlock(meetingRoomId = 3) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingRoomReservationCalendarBlock meetingRoomId={meetingRoomId} />
    </QueryClientProvider>,
  )
}

describe('MeetingRoomReservationCalendarBlock - 정상 렌더', () => {
  it('예약 현황이 mapMeetingRoomReservationsToEvents로 매핑된 이벤트로 캘린더에 렌더된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, () =>
        HttpResponse.json([makeItem('홍길동')]),
      ),
    )

    renderBlock()

    expect(await screen.findByText('개발팀 · 홍길동 (참여자 2명)')).toBeInTheDocument()
  })

  it('이벤트를 클릭하면 카드 하단에 예약 요약(예약자·참여자)이 나타난다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, () =>
        HttpResponse.json([makeItem('홍길동')]),
      ),
    )

    const user = userEvent.setup()
    renderBlock()

    await user.click(await screen.findByText('개발팀 · 홍길동 (참여자 2명)'))

    // 캘린더 하단 조회 카드: 헤더 + 예약자(부서·이름) + 참여자 수.
    expect(await screen.findByText('선택한 예약')).toBeInTheDocument()
    expect(screen.getByText('개발팀 · 홍길동')).toBeInTheDocument()
    expect(screen.getByText('2명')).toBeInTheDocument()
  })

  it('"예약 요약 닫기"를 누르면 조회 카드가 사라진다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, () =>
        HttpResponse.json([makeItem('홍길동')]),
      ),
    )

    const user = userEvent.setup()
    renderBlock()

    await user.click(await screen.findByText('개발팀 · 홍길동 (참여자 2명)'))
    await screen.findByText('선택한 예약')

    await user.click(screen.getByRole('button', { name: '예약 요약 닫기' }))

    expect(screen.queryByText('선택한 예약')).not.toBeInTheDocument()
  })

  it('캘린더는 항상 마운트되어 있다(FullCalendar 표준 DOM)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, () => HttpResponse.json([])),
    )

    renderBlock()

    await waitFor(() => expect(document.querySelector('.fc')).toBeInTheDocument())
  })
})

describe('MeetingRoomReservationCalendarBlock - 에러 상태', () => {
  it('404는 형제 블록(MeetingRoomInfoPanel)이 이미 안내하므로 토스트를 띄우지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/999/reservations/calendar`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '회의실을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    renderBlock(999)

    await waitFor(() => expect(document.querySelector('.fc')).toBeInTheDocument())
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('그 외 에러(500)는 토스트를 띄운다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderBlock()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})
