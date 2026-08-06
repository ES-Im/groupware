import type { EventInput } from '@fullcalendar/core'
import type { MeetingRoomReservationCalendarItem } from '../model/meeting'

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
