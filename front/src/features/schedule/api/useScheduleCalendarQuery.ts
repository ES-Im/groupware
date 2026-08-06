import { useQuery } from '@tanstack/react-query'
import type { CalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import { scheduleKeys } from '../model/scheduleKeys'
import { getScheduleCalendar } from './getScheduleCalendar'

export function useScheduleCalendarQuery(params?: CalendarRangeParams & { scheduleType?: string }) {
  return useQuery({
    queryKey: scheduleKeys.calendar(params),
    queryFn: () => getScheduleCalendar(params),
  })
}
