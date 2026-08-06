import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMyMeetingReservationsCalendarQuery } from '../api/useMyMeetingReservationsCalendarQuery'
import { MeetingCalendar } from '../components/MeetingCalendar'
import { MeetingReservationDetailPanel } from '../components/MeetingReservationDetailPanel'
import { buildCalendarRangeParams, type CalendarRangeParams } from '../lib/calendarRange'

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

  function handleEventClick(info: EventClickArg) {
    setSelectedMeetingId(Number(info.event.id))
  }

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:h-full lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">내 예약 캘린더</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          내가 예약한 회의 일정을 캘린더로 확인합니다
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[7fr_3fr]">
        <Card className="h-[440px] lg:h-auto lg:min-h-0">
          <CardHeader className="border-b">
            <CardTitle>내가 예약한 회의</CardTitle>
            <CardAction>
              <Button type="button" onClick={() => navigate('/meetings/new')}>
                회의 예약하기
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <MeetingCalendar
                events={events}
                onRangeChange={handleRangeChange}
                onEventClick={handleEventClick}
                fillHeight
              />
            </div>
          </CardContent>
        </Card>

        <div className="min-h-0 lg:overflow-y-auto lg:[&>[data-testid=reservation-detail-panel]]:min-h-full">
          <MeetingReservationDetailPanel meetingId={selectedMeetingId} />
        </div>
      </div>
    </div>
  )
}
