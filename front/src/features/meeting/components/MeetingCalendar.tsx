import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import { cn } from '@/shared/lib/utils'
import './meetingCalendar.css'

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
  /**
   * true면 dayGrid 날짜 셀 높이를 셀 너비의 50%(가로:세로 2:1)로 렌더한다(meetingCalendar.css의
   * .meeting-calendar--compact 스코프). 셀이 콘텐츠 높이로 과하게 세로로 길어지지 않게 하는 P1(내
   * 예약 캘린더) 전용 옵트인 — 공유 래퍼를 그대로 쓰는 P7(회의실 예약 캘린더)은 켜지 않아 종전
   * 렌더가 유지된다.
   */
  compactCells?: boolean
}

export function MeetingCalendar({
  events,
  onRangeChange,
  onEventClick,
  compactCells = false,
}: MeetingCalendarProps) {
  return (
    <div className={cn('meeting-calendar', compactCells && 'meeting-calendar--compact')}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={events}
        datesSet={(arg: DatesSetArg) => onRangeChange({ start: arg.view.activeStart, end: arg.view.activeEnd })}
        eventClick={onEventClick}
      />
    </div>
  )
}
