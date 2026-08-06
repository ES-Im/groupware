import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import { cn } from '@/shared/lib/utils'
import './meetingCalendar.css'

interface MeetingCalendarProps {
  events: EventInput[]
  onRangeChange: (range: { start: Date; end: Date }) => void
  onEventClick?: (info: EventClickArg) => void
  compactCells?: boolean
  fillHeight?: boolean
}

export function MeetingCalendar({
  events,
  onRangeChange,
  onEventClick,
  compactCells = false,
  fillHeight = false,
}: MeetingCalendarProps) {
  return (
    <div
      className={cn(
        'meeting-calendar',
        compactCells && 'meeting-calendar--compact',
        fillHeight && 'h-full',
      )}
    >
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height={fillHeight ? '100%' : 'auto'}
        events={events}
        datesSet={(arg: DatesSetArg) => onRangeChange({ start: arg.view.activeStart, end: arg.view.activeEnd })}
        eventClick={onEventClick}
      />
    </div>
  )
}
