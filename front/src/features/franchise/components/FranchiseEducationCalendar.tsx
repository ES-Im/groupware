import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'

/**
 * franchise 도메인 FullCalendar 래퍼(ROADMAP(FRANCHISE) T4.1 — MeetingCalendar 동형 복제).
 * 이벤트 데이터 형태는 FullCalendar 표준 `EventInput`으로 제네릭하게 유지하고, range 파라미터
 * 포맷 변환(lib/calendarRange.ts의 buildFranchiseCalendarRangeParams)은 이 컴포넌트를 소비하는
 * 페이지의 책임으로 남긴다(래퍼는 Date만 다뤄 결합도를 낮춘다). 도메인 간 컴포넌트 import를
 * 금지하는 컨벤션에 따라 meeting 래퍼를 재사용하지 않고 franchise 전용으로 둔다.
 */
interface FranchiseEducationCalendarProps {
  events: EventInput[]
  onRangeChange: (range: { start: Date; end: Date }) => void
  onEventClick?: (info: EventClickArg) => void
}

export function FranchiseEducationCalendar({
  events,
  onRangeChange,
  onEventClick,
}: FranchiseEducationCalendarProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      height="auto"
      events={events}
      datesSet={(arg: DatesSetArg) =>
        onRangeChange({ start: arg.view.activeStart, end: arg.view.activeEnd })
      }
      eventClick={onEventClick}
    />
  )
}
