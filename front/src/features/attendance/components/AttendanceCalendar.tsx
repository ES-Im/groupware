import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import koLocale from '@fullcalendar/core/locales/ko'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import './attendanceCalendar.css'

interface AttendanceCalendarProps {
  events: EventInput[]
  initialDate: string
  onEventClick: (arg: EventClickArg) => void
}

export function AttendanceCalendar({ events, initialDate, onEventClick }: AttendanceCalendarProps) {
  return (
    <div className="attendance-calendar h-full">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale={koLocale}
        headerToolbar={false}
        height="100%"
        events={events}
        eventDisplay="block"
        dayMaxEvents
        eventClick={onEventClick}
      />
    </div>
  )
}
