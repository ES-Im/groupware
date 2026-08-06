export type AttendanceStatus =
  | 'NORMAL'
  | 'LATE_EARLY'
  | 'HALF_DAY_LEAVE'
  | 'ALL_DAY_LEAVE'
  | 'SICK_LEAVE'
  | 'ABSENT'

export interface AttendanceItem {
  attendanceId: number
  attendanceStatus: AttendanceStatus | null
  attendanceDate: string
  startAt: string | null
  endAt: string | null
  isApproved: boolean
  draftId: number | null
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type MyAttendance = Page<AttendanceItem>

export interface MyAttendanceSummary {
  approvedAttendanceCount: number
  pendingAttendanceCount: number
  totalAttendanceCount: number
  overtimeMinutes: number
}
