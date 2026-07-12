import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import koLocale from '@fullcalendar/core/locales/ko'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import './attendanceCalendar.css'

/**
 * 부서 근태 상세용 FullCalendar(dayGridMonth) 표시 전용 래퍼. schedule의 ScheduleCalendar와 달리
 * 드래그/생성 상호작용이 없어(근태는 조회+수정 다이얼로그만) interaction 플러그인·툴바 ref를 두지
 * 않는다. headerToolbar는 끄고(월 컨텍스트는 소비처 카드 헤더가 표시), height="100%"로 부모 높이를
 * 꽉 채운다.
 *
 * initialDate는 소비처가 현재 필터 월(YYYY-MM-01)로 주입한다. FullCalendar는 initialDate를 마운트
 * 시점에만 반영하므로, 월이 바뀌면 소비처가 key로 이 컴포넌트를 리마운트해 표시 월을 갱신한다.
 * eventClick은 미승인 근태일 때만 수정 다이얼로그를 여는 소비처 콜백으로 위임한다.
 */
interface AttendanceCalendarProps {
  events: EventInput[]
  /** 표시할 월의 첫날(YYYY-MM-01). 현재 근태 필터의 yearMonth와 맞춘다. */
  initialDate: string
  /** 이벤트 클릭 → 미승인 건이면 근태 수정 다이얼로그(F307). */
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
