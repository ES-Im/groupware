import type { AttendanceStatus } from './attendance'

interface MyMonthlyParams {
  yearMonth?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}

interface DeptMonthlyParams {
  yearMonth?: string
  keyword?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}

interface DeptPendingParams {
  status?: AttendanceStatus
  page?: number
  size?: number
}

export const attendanceKeys = {
  all: ['attendance'] as const,
  myMonthly: (params?: MyMonthlyParams) =>
    [...attendanceKeys.all, 'myMonthly', params] as const,
  mySummary: (yearMonth?: string) => [...attendanceKeys.all, 'mySummary', yearMonth] as const,
  deptMonthly: (deptId: number | undefined, params?: DeptMonthlyParams) =>
    [...attendanceKeys.all, 'dept', deptId, 'monthly', params] as const,
  deptPending: (deptId: number | undefined, params?: DeptPendingParams) =>
    [...attendanceKeys.all, 'dept', deptId, 'pending', params] as const,
}
