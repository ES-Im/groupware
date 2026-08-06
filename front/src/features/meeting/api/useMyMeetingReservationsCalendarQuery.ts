import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { CalendarRangeParams } from '../lib/calendarRange'
import { getMyMeetingReservationsCalendar } from './getMyMeetingReservationsCalendar'

export function useMyMeetingReservationsCalendarQuery(range?: CalendarRangeParams) {
  return useQuery({
    queryKey: meetingKeys.myReservationsCalendar(range),
    queryFn: () => getMyMeetingReservationsCalendar(range),
  })
}
