import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'

/**
 * meeting 도메인 재사용 FullCalendar 래퍼(ROADMAP T1.2, FullCalendar 첫 소비처).
 * F800(내 예약 캘린더, T1.4)·F809(회의실 예약 캘린더, M2 T2.3/T2.4)가 공용 소비하므로
 * 이벤트 데이터 형태는 FullCalendar 표준 `EventInput`으로 제네릭하게 유지하고,
 * range 파라미터 포맷 변환(calendarRange.ts의 buildCalendarRangeParams)은 이
 * 컴포넌트를 소비하는 페이지의 책임으로 남긴다(래퍼는 Date만 다뤄 결합도를 낮춘다).
 */
interface MeetingCalendarProps {
  events: EventInput[]
  onRangeChange: (range: { start: Date; end: Date }) => void
  onEventClick?: (info: EventClickArg) => void
}

export function MeetingCalendar({ events, onRangeChange, onEventClick }: MeetingCalendarProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      height="auto"
      events={events}
      datesSet={(arg: DatesSetArg) => onRangeChange({ start: arg.view.activeStart, end: arg.view.activeEnd })}
      eventClick={onEventClick}
    />
  )
}
