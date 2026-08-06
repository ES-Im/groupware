import { apiClient } from '@/shared/api/client'
import type { CalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import type { ScheduleCalendarItem } from '../model/schedule'

export async function getScheduleCalendar(
  params?: CalendarRangeParams & { scheduleType?: string },
): Promise<ScheduleCalendarItem[]> {
  const { data } = await apiClient.get<ScheduleCalendarItem[]>('/api/schedules/calendar', { params })
  return data
}
