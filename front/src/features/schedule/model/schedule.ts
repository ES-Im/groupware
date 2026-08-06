export type ScheduleType = 'MANUAL' | 'MEETING' | 'LEAVE' | 'BUSINESS_TRIP'

export const SCHEDULE_TYPES: ScheduleType[] = ['MANUAL', 'MEETING', 'LEAVE', 'BUSINESS_TRIP']

export interface ScheduleCalendarItem {
  scheduleId: number
  scheduleType: ScheduleType
  title: string
  scheduleDate: string
  startAt: string
  endAt: string
  isAllDay: boolean
  isCanceled: boolean
}
