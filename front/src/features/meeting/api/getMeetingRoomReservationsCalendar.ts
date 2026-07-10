import { apiClient } from '@/shared/api/client'
import type { CalendarRangeParams } from '../lib/calendarRange'
import type { MeetingRoomReservationCalendarItem } from '../model/meeting'

/**
 * 회의실 예약 캘린더 조회(`MEETING_ROOM_RESERVATIONS_CALENDAR`, api-endpoint.md 기능ID
 * `MEETING_ROOM_RESERVATIONS_CALENDAR` →
 * `GET /api/meeting-rooms/{meetingRoomId}/reservations/calendar`, 권한 EMPLOYEE).
 * range 미입력 시 서버가 당월 기본값을 적용한다.
 */
export async function getMeetingRoomReservationsCalendar(
  meetingRoomId: number,
  range?: CalendarRangeParams,
): Promise<MeetingRoomReservationCalendarItem[]> {
  const { data } = await apiClient.get<MeetingRoomReservationCalendarItem[]>(
    `/api/meeting-rooms/${meetingRoomId}/reservations/calendar`,
    { params: range },
  )
  return data
}
