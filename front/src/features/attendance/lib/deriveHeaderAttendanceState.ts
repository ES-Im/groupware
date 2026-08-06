import type { AttendanceItem } from '@/features/attendance/model/attendance'

export interface HeaderAttendanceState {
  canCheckIn: boolean
  canCheckOut: boolean
  checkInTime: string | null
  checkOutTime: string | null
}

function formatTime(value: string): string {
  return value.slice(0, 5)
}

export function deriveHeaderAttendanceState(monthlyList: AttendanceItem[], today: string): HeaderAttendanceState {
  const todayRecords = monthlyList.filter((item) => item.attendanceDate === today)

  const startTimes = todayRecords
    .map((record) => record.startAt)
    .filter((value): value is string => value !== null)
    .sort()
  const endTimes = todayRecords
    .map((record) => record.endAt)
    .filter((value): value is string => value !== null)
    .sort()

  return {
    canCheckIn: todayRecords.length === 0,
    canCheckOut: todayRecords.length > 0,
    checkInTime: startTimes.length > 0 ? formatTime(startTimes[0]) : null,
    checkOutTime: endTimes.length > 0 ? formatTime(endTimes[endTimes.length - 1]) : null,
  }
}
