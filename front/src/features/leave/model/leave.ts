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

export interface LeaveSummary {
  annualBaseGrantDays: number
  annualUsedDays: number
  specialGrantDays: number
  specialUsedDays: number
  compensatoryGrantDays: number
  compensatoryUsedDays: number
}

export interface EmpLeaveSummaryRow {
  empId: number
  empNo: string
  empName: string
  deptName: string
  positionName: string
  leaveSummary: LeaveSummary
}

export type EmpLeaveSummaryPage = Page<EmpLeaveSummaryRow>

export interface LeaveUsageSummary {
  annualLeaveUsagePercent: number
}

export interface AdjustGrantDaysTarget {
  empId: number
  empName: string
  leaveKind: 'SPECIAL' | 'COMPENSATORY'
}
