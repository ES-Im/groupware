import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMyMeetingReservationsCalendarQuery } from '../api/useMyMeetingReservationsCalendarQuery'
import { MeetingCalendar } from '../components/MeetingCalendar'
import { MeetingReservationDetailPanel } from '../components/MeetingReservationDetailPanel'
import { buildCalendarRangeParams, type CalendarRangeParams } from '../lib/calendarRange'

/**
 * P1 내 예약 캘린더 페이지(F800, ROADMAP(MEETING-ROOMS) M1 T1.4).
 * T1.2 FullCalendar 래퍼에 T1.3 조회 결과를 이벤트로 바인딩한다. 취소건(isCanceled=true)은
 * classNames(opacity-50 + line-through)로 시각 구분한다 — MeetingCalendar(T1.2)의 props를
 * 확장하지 않고 FullCalendar 표준 eventClassNames만으로 처리 가능한 최소 방식(F809도 이
 * 래퍼를 재사용하므로 래퍼 자체는 이벤트 형태에 결합시키지 않는다).
 * 이벤트 클릭·[회의 예약하기]의 라우팅은 M8 T8.1에서 배선되므로 이 페이지는 navigate 경로
 * 문자열만 준비한다(직접 URL `/meetings` 진입으로만 검증).
 */
export function MyMeetingCalendarPage() {
  const navigate = useNavigate()
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | undefined>(undefined)
  const { data, error } = useMyMeetingReservationsCalendarQuery(range)

  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  const events: EventInput[] = (data ?? []).map((item) => ({
    id: String(item.meetingId),
    title: `${item.meetingRoomName} · ${item.title} · ${item.startAt}~${item.endAt}`,
    start: `${item.meetingDate}T${item.startAt}`,
    end: `${item.meetingDate}T${item.endAt}`,
    classNames: item.isCanceled ? ['opacity-50', 'line-through'] : [],
  }))

  function handleRangeChange(nextRange: { start: Date; end: Date }) {
    setRange(buildCalendarRangeParams(nextRange.start, nextRange.end))
  }

  // 이벤트 클릭 시 상세 "페이지"로 이동하는 대신, 선택된 예약을 캘린더 아래 인라인 상세 패널로 표시한다.
  function handleEventClick(info: EventClickArg) {
    setSelectedMeetingId(Number(info.event.id))
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">내 예약 캘린더</h1>
        <Button type="button" onClick={() => navigate('/meetings/new')}>
          회의 예약하기
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>내가 예약한 회의</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingCalendar
              events={events}
              onRangeChange={handleRangeChange}
              onEventClick={handleEventClick}
              compactCells
            />
          </CardContent>
        </Card>

        <MeetingReservationDetailPanel meetingId={selectedMeetingId} />
      </div>
    </div>
  )
}
