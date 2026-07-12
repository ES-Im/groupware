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

/**
 * schedule 전용 FullCalendar 래퍼(구 MeetingCalendar 재사용 방식 폐기 — 4개 뷰·ref 기반 뷰 전환·
 * 드래그앤드롭·업무시간대(07~20시)·30분 슬롯 요구를 감당하기 위해 신규 구성).
 *
 * 커스텀 툴바(ScheduleToolbar)가 prev/next/today/changeView를 호출할 수 있도록 FullCalendar 인스턴스
 * ref를 부모(ScheduleCalendarPage)로부터 prop으로 주입받는다(headerToolbar는 끄고 shadcn 툴바로 대체).
 * range 변환(buildCalendarRangeParams)·이벤트 매핑(mapScheduleToEvents)·mutation 배선은 전부 소비처
 * 책임으로 남기고, 이 래퍼는 표준 EventInput[]과 콜백만 다뤄 결합도를 낮춘다.
 *
 * height="100%"(구 "auto")로 부모(ScheduleCalendarPage의 flex-1 CardContent)가 만드는 메인 컨텐츠
 * 영역 높이에 꽉 채운다 — 이벤트가 많은 날짜가 있어도 페이지 전체가 늘어나지 않는다. dayMaxEvents로
 * dayGrid 셀당 표시 개수를 제한해 넘치는 이벤트는 "+N개 더보기" 팝오버로 축약한다.
 */
interface ScheduleCalendarProps {
  /** 부모가 소유하는 FullCalendar ref(툴바가 getApi()로 뷰/네비게이션 제어). */
  calendarRef: RefObject<FullCalendar | null>
  events: EventInput[]
  /** 뷰/네비게이션 변경마다 호출 — range 재요청·툴바 타이틀/활성 뷰 동기화에 쓴다. */
  onDatesSet: (arg: DatesSetArg) => void
  /** 빈 날짜/슬롯 클릭 → 일정 등록. */
  onDateClick: (arg: DateClickArg) => void
  /** 이벤트 클릭 → 상세/수정 다이얼로그. */
  onEventClick: (arg: EventClickArg) => void
  /** MANUAL 미취소 이벤트 드래그 이동(서버가 소유자 최종 판정, 실패 시 revert). */
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
