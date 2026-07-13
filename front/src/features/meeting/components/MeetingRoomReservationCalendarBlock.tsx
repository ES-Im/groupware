import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeetingRoomReservationsCalendarQuery } from '../api/useMeetingRoomReservationsCalendarQuery'
import { MeetingCalendar } from './MeetingCalendar'
import { buildCalendarRangeParams, type CalendarRangeParams } from '../lib/calendarRange'
import { mapMeetingRoomReservationsToEvents } from '../lib/mapMeetingRoomReservationsToEvents'

interface MeetingRoomReservationCalendarBlockProps {
  meetingRoomId: number
}

/**
 * 회의실 예약(점유) 캘린더 공유 블록(ROADMAP(MEETING-ROOMS) T2.4-b, F809).
 *
 * `meetingRoomId` props만으로 독립 렌더 가능 — P4(T2.4-b)·P7(M7 T7.2)이 공유 소비한다.
 * 응답에 `meetingId`가 없어(model/meeting.ts 주석 참고) 상세로 이동시킬 식별자가 없으므로
 * `MeetingCalendar`에 `onEventClick`을 넘기지 않는다 — 점유 시간대만 확인하는 용도다.
 */
export function MeetingRoomReservationCalendarBlock({ meetingRoomId }: MeetingRoomReservationCalendarBlockProps) {
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const { data, error } = useMeetingRoomReservationsCalendarQuery(meetingRoomId, range)

  // 회의실 자체의 not-found는 형제 블록(MeetingRoomInfoPanel)이 이미 안내하므로, 여기서는
  // 그 외 실패만 토스트로 알린다. MeetingCalendar는 항상 마운트해 range 변경(=새 queryKey)에
  // 따른 재조회 중에도 리마운트되지 않게 한다(MyMeetingCalendarPage와 동일 패턴 — 리마운트되면
  // FullCalendar가 initialDate 없이 현재 월로 리셋돼 월 이동이 막힌다).
  useEffect(() => {
    if (!error) {
      return
    }
    const apiError = normalizeApiError(error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [error])

  function handleRangeChange(nextRange: { start: Date; end: Date }) {
    setRange(buildCalendarRangeParams(nextRange.start, nextRange.end))
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>기간별 예약 현황</CardTitle>
        <CardDescription>타 부서 예약은 점유 시간대만 표시되며 제목은 공개되지 않습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <MeetingCalendar events={mapMeetingRoomReservationsToEvents(data ?? [])} onRangeChange={handleRangeChange} />
      </CardContent>
    </Card>
  )
}
