import type { DeptLeaveHistoryParams, DeptLeaveSummaryParams, DeptLeaveUsageSummaryParams } from './deptLeave'
import type { MyLeaveHistoryParams } from './myLeave'

interface EmpSummaryParams {
  keyword?: string
  deptId?: number
  year?: number
  page?: number
  size?: number
}

interface EmpUsageSummaryParams {
  deptId?: number
  year?: number
}

export const leaveKeys = {
  all: ['leave'] as const,
  myHistory: (params?: MyLeaveHistoryParams) => [...leaveKeys.all, 'myHistory', params] as const,
  mySummary: (year?: number) => [...leaveKeys.all, 'mySummary', year] as const,
  empSummary: (params?: EmpSummaryParams) => [...leaveKeys.all, 'emp', 'summary', params] as const,
  empUsageSummary: (params?: EmpUsageSummaryParams) =>
    [...leaveKeys.all, 'emp', 'usageSummary', params] as const,
  deptHistory: (deptId: number | undefined, params?: DeptLeaveHistoryParams) =>
    [...leaveKeys.all, 'dept', deptId, 'history', params] as const,
  deptSummary: (deptId: number | undefined, params?: DeptLeaveSummaryParams) =>
    [...leaveKeys.all, 'dept', deptId, 'summary', params] as const,
  deptUsageSummary: (deptId: number | undefined, params?: DeptLeaveUsageSummaryParams) =>
    [...leaveKeys.all, 'dept', deptId, 'usageSummary', params] as const,
}
