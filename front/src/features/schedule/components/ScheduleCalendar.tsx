import type { RefObject } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import type { DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import './scheduleCalendar.css'

interface ScheduleCalendarProps {
  calendarRef: RefObject<FullCalendar | null>
  events: EventInput[]
  onDatesSet: (arg: DatesSetArg) => void
  onDateClick: (arg: DateClickArg) => void
  onEventClick: (arg: EventClickArg) => void
  onEventDrop: (arg: EventDropArg) => void
}

export function ScheduleCalendar({
  calendarRef,
  events,
  onDatesSet,
  onDateClick,
  onEventClick,
  onEventDrop,
}: ScheduleCalendarProps) {
  return (
    <div className="schedule-calendar h-full">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={koLocale}
        headerToolbar={false}
        height="100%"
        dayMaxEvents
        events={events}
        eventDisplay="block"
        nowIndicator
        slotDuration="00:30:00"
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot
        datesSet={onDatesSet}
        dateClick={onDateClick}
        eventClick={onEventClick}
        eventDrop={onEventDrop}
      />
    </div>
  )
}
