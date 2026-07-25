import type { AttendanceStatus } from '@/features/attendance/model/attendance'

export type AttendanceBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface AttendanceStatusBadgeInfo {
  label: string
  variant: AttendanceBadgeVariant
}


export const attendanceStatusBadgeMap: Record<AttendanceStatus, AttendanceStatusBadgeInfo> = {
  NORMAL: { label: '정상', variant: 'default' },
  LATE_EARLY: { label: '지각/조퇴', variant: 'destructive' },
  HALF_DAY_LEAVE: { label: '반차', variant: 'secondary' },
  ALL_DAY_LEAVE: { label: '연차', variant: 'secondary' },
  SICK_LEAVE: { label: '병가', variant: 'outline' },
  ABSENT: { label: '결근', variant: 'destructive' },
}


export function getAttendanceStatusBadge(status: AttendanceStatus | null): AttendanceStatusBadgeInfo {
  if (status === null) {
    return { label: '진행 중', variant: 'outline' }
  }
  return attendanceStatusBadgeMap[status]
}
