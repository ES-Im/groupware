import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { CalendarRangeParams } from '../lib/calendarRange'
import { getMeetingRoomReservationsCalendar } from './getMeetingRoomReservationsCalendar'

export function useMeetingRoomReservationsCalendarQuery(
  meetingRoomId: number | undefined,
  range?: CalendarRangeParams,
) {
  return useQuery({
    queryKey: meetingKeys.roomReservationsCalendar(meetingRoomId, range),
    queryFn: () => getMeetingRoomReservationsCalendar(meetingRoomId as number, range),
    enabled: meetingRoomId != null,
  })
}
