import type { EventInput } from '@fullcalendar/core'
import type { MeetingRoomReservationCalendarItem } from '../model/meeting'

/**
 * 회의실 예약 캘린더(F809) 응답을 MeetingCalendar(T1.2 FullCalendar 래퍼)가 소비하는
 * EventInput[]으로 매핑한다. 응답에 `meetingId`가 없어(설계 의도, model/meeting.ts 주석 참고)
 * 이벤트에 id를 부여하지 않는다 — 상세(P3)로 이동시킬 식별자가 없으므로 이 캘린더의 이벤트는
 * 클릭해도 상세로 링크하지 않는다(호출부는 onEventClick을 배선하지 않는다).
 */
export function mapMeetingRoomReservationsToEvents(
  items: MeetingRoomReservationCalendarItem[],
): EventInput[] {
  return items.map((item) => ({
    title: `${item.reserverDeptName} · ${item.reserverEmpName} (참여자 ${item.participantCount}명)`,
    start: `${item.meetingDate}T${item.startAt}`,
    end: `${item.meetingDate}T${item.endAt}`,
  }))
}
