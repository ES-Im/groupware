import dayjs from 'dayjs'
import type { AttendanceItem } from '@/features/attendance/model/attendance'

export interface TodayAttendanceButtonState {
  canCheckIn: boolean
  canCheckOut: boolean
}

export function deriveTodayAttendanceButtonState(
  monthlyList: AttendanceItem[],
): TodayAttendanceButtonState {
  const today = dayjs().format('YYYY-MM-DD')
  const todayRecords = monthlyList.filter((item) => item.attendanceDate === today)

  if (todayRecords.length === 0) {
    return { canCheckIn: true, canCheckOut: false }
  }

  const hasOpenRecord = todayRecords.some((record) => record.startAt !== null && record.endAt === null)

  if (hasOpenRecord) {
    return { canCheckIn: false, canCheckOut: true }
  }

  return { canCheckIn: false, canCheckOut: false }
}
