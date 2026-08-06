import { useEffect, useState } from 'react'
import type { EventClickArg } from '@fullcalendar/core'
import { CalendarClock, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeetingRoomReservationsCalendarQuery } from '../api/useMeetingRoomReservationsCalendarQuery'
import type { MeetingRoomReservationCalendarItem } from '../model/meeting'
import { MeetingCalendar } from './MeetingCalendar'
import { buildCalendarRangeParams, type CalendarRangeParams } from '../lib/calendarRange'
import { mapMeetingRoomReservationsToEvents } from '../lib/mapMeetingRoomReservationsToEvents'

interface MeetingRoomReservationCalendarBlockProps {
  meetingRoomId: number
}

function toHourMinute(time: string): string {
  return time.slice(0, 5)
}

export function MeetingRoomReservationCalendarBlock({ meetingRoomId }: MeetingRoomReservationCalendarBlockProps) {
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [selectedReservation, setSelectedReservation] = useState<MeetingRoomReservationCalendarItem | null>(null)
  const { data, error } = useMeetingRoomReservationsCalendarQuery(meetingRoomId, range)

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
    setSelectedReservation(null)
  }

  function handleEventClick(info: EventClickArg) {
    setSelectedReservation(info.event.extendedProps as MeetingRoomReservationCalendarItem)
  }

  return (
    <Card className="lg:min-h-0">
      <CardHeader className="border-b">
        <CardTitle>기간별 예약 현황</CardTitle>
        <CardDescription>타 부서 예약은 점유 시간대만 표시되며 제목은 공개되지 않습니다.</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="min-h-0 max-lg:h-[26rem] lg:flex-1">
          <MeetingCalendar
            events={mapMeetingRoomReservationsToEvents(data ?? [])}
            onRangeChange={handleRangeChange}
            onEventClick={handleEventClick}
            fillHeight
          />
        </div>
        {selectedReservation && (
          <div className="shrink-0 rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">선택한 예약</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="예약 요약 닫기"
                onClick={() => setSelectedReservation(null)}
              >
                <X />
              </Button>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">예약자</dt>
                <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {selectedReservation.reserverDeptName} · {selectedReservation.reserverEmpName}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  예약 시간
                </dt>
                <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {selectedReservation.meetingDate} {toHourMinute(selectedReservation.startAt)}
                  {' ~ '}
                  {toHourMinute(selectedReservation.endAt)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  참여자
                </dt>
                <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {selectedReservation.participantCount}명
                </dd>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
