import { apiClient } from '@/shared/api/client'
import type { CalendarRangeParams } from '../lib/calendarRange'
import type { MyMeetingReservationCalendarItem } from '../model/meeting'

export async function getMyMeetingReservationsCalendar(
  range?: CalendarRangeParams,
): Promise<MyMeetingReservationCalendarItem[]> {
  const { data } = await apiClient.get<MyMeetingReservationCalendarItem[]>(
    '/api/meetings/my/reservations/calendar',
    { params: range },
  )
  return data
}
