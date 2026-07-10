import { apiClient } from '@/shared/api/client'
import type { CalendarRangeParams } from '../lib/calendarRange'
import type { MyMeetingReservationCalendarItem } from '../model/meeting'

/**
 * 내 회의 예약 캘린더 조회(`MY_MEETING_RESERVATIONS_CALENDAR`, api-endpoint.md 기능ID
 * `MY_MEETING_RESERVATIONS_CALENDAR` → `GET /api/meetings/my/reservations/calendar`,
 * 권한 EMPLOYEE 본인). range 미입력 시 서버가 당월 기본값을 적용한다.
 */
export async function getMyMeetingReservationsCalendar(
  range?: CalendarRangeParams,
): Promise<MyMeetingReservationCalendarItem[]> {
  const { data } = await apiClient.get<MyMeetingReservationCalendarItem[]>(
    '/api/meetings/my/reservations/calendar',
    { params: range },
  )
  return data
}
