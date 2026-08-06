import type { CalendarRangeParams } from '@/features/meeting/lib/calendarRange'

export const scheduleKeys = {
  all: ['schedule'] as const,
  calendar: (params?: CalendarRangeParams & { scheduleType?: string }) =>
    params === undefined
      ? ([...scheduleKeys.all, 'calendar'] as const)
      : ([...scheduleKeys.all, 'calendar', params] as const),
  detail: (scheduleId: number | undefined) => [...scheduleKeys.all, 'detail', scheduleId] as const,
}
