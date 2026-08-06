import { apiClient } from '@/shared/api/client'
import type { CalendarRangeParams } from '../lib/calendarRange'
import type { MeetingRoomReservationCalendarItem } from '../model/meeting'

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
