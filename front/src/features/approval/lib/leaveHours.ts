import dayjs from 'dayjs'
import type { LeaveType } from '../model/leaveDraftSchema'

export const LEAVE_DAY_START_HOUR = 9
export const LEAVE_DAY_END_HOUR = 18
export const LEAVE_WORK_HOURS = 8
export const LEAVE_BREAK_HOURS = 1

export const FOUR_HOUR_UNIT_LEAVE_TYPES = [
  'ANNUAL',
  'SPECIAL',
  'COMPENSATORY',
] as const satisfies readonly LeaveType[]

export const LEAVE_HOUR_UNIT = 4

export function isFourHourUnitLeaveType(leaveType: string | undefined): boolean {
  return (FOUR_HOUR_UNIT_LEAVE_TYPES as readonly string[]).includes(leaveType ?? '')
}

export const LEAVE_START_HOUR_OPTIONS = ['09', '13'] as const
export const LEAVE_END_HOUR_OPTIONS = ['13', '18'] as const

function usedHoursOfRawSpan(rawHours: number): number {
  if (rawHours <= 0) {
    return 0
  }
  return rawHours - (rawHours > 4 ? LEAVE_BREAK_HOURS : 0)
}

export function calculateUsedLeaveHours(
  startDate: string,
  startHour: string,
  endDate: string,
  endHour: string,
): number | null {
  if (!startDate || !startHour || !endDate || !endHour) {
    return null
  }
  const start = Number(startHour)
  const end = Number(endHour)
  if (endDate < startDate || (endDate === startDate && end <= start)) {
    return null
  }
  if (startDate === endDate) {
    return usedHoursOfRawSpan(end - start)
  }
  const middleDays = dayjs(endDate).diff(dayjs(startDate), 'day') - 1
  return (
    usedHoursOfRawSpan(LEAVE_DAY_END_HOUR - start) +
    middleDays * LEAVE_WORK_HOURS +
    usedHoursOfRawSpan(end - LEAVE_DAY_START_HOUR)
  )
}

export function calculateUsedLeaveDays(
  startDate: string,
  startHour: string,
  endDate: string,
  endHour: string,
): number | null {
  const hours = calculateUsedLeaveHours(startDate, startHour, endDate, endHour)
  return hours === null ? null : hours / LEAVE_WORK_HOURS
}

export function formatLeaveDays(days: number): string {
  return `${days.toFixed(1)}일`
}
