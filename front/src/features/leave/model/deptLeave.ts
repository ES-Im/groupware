import type { ApprovalStatus } from '@/features/approval/model/approval'
import type { MyLeaveHistoryEntry } from './myLeave'

export interface DeptLeaveHistoryRow {
  empId: number
  empNo: string
  empName: string
  historyResponse: MyLeaveHistoryEntry
}

export interface DeptLeaveHistoryParams {
  keyword?: string
  approvalStatus?: ApprovalStatus
  yearMonth?: string
  page?: number
  size?: number
}

export interface DeptLeaveSummaryParams {
  keyword?: string
  year?: number
  page?: number
  size?: number
}

export interface DeptLeaveUsageSummaryParams {
  year?: number
}
