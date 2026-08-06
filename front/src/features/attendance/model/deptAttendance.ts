import type { AttendanceItem, Page } from './attendance'

export interface DeptAttendanceEmpInfo {
  empId: number
  empNo: string
  empName: string
  deptName: string
  positionName: string
}

export interface AttendanceSummaryCounts {
  approvedAttendanceCount: number
  pendingAttendanceCount: number
  totalAttendanceCount: number
  overtimeMinutes: number
}

export interface DeptAttendanceRow {
  empInfo: DeptAttendanceEmpInfo
  summary: AttendanceSummaryCounts
  attendanceInfo: AttendanceItem[]
}

export interface DeptPendingRow {
  empInfo: DeptAttendanceEmpInfo
  attendanceInfo: AttendanceItem
}

export type DeptAttendanceMonthly = Page<DeptAttendanceRow>

export type DeptAttendancePending = Page<DeptPendingRow>

export interface AttendanceEditTarget {
  targetEmpId: number
  attendanceId: number
  startAt: string | null
  endAt: string | null
}
