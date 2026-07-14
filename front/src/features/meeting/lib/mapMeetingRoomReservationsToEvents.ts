import type { EventInput } from '@fullcalendar/core'
import type { MeetingRoomReservationCalendarItem } from '../model/meeting'

/**
 * 회의실 예약 캘린더(F809) 응답을 MeetingCalendar(T1.2 FullCalendar 래퍼)가 소비하는
 * EventInput[]으로 매핑한다. 응답에 `meetingId`가 없어(설계 의도, model/meeting.ts 주석 참고)
 * 이벤트에 id를 부여하지 않는다 — 상세(P3)로 이동시킬 식별자가 없다.
 *
 * 다만 이벤트 클릭 시 회의실 상세 화면(P4/P7)이 카드 하단에 예약 요약(예약자·시간·참여자)을
 * 인라인으로 보여주므로(사용자 요청), 원본 항목 전체를 `extendedProps`로 실어 클릭 핸들러가
 * 값을 그대로 꺼내 쓸 수 있게 한다.
 */
export function mapMeetingRoomReservationsToEvents(
  items: MeetingRoomReservationCalendarItem[],
): EventInput[] {
  return items.map((item) => ({
    title: `${item.reserverDeptName} · ${item.reserverEmpName} (참여자 ${item.participantCount}명)`,
    start: `${item.meetingDate}T${item.startAt}`,
    end: `${item.meetingDate}T${item.endAt}`,
    extendedProps: { ...item },
  }))
}
