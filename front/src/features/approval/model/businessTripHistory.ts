import type { ApprovalStatus } from './approval'

export interface BusinessTripHistoryEntry {
  draftId: number
  startAt: string
  endAt: string
  destination: string
  purpose: string
  approvalStatus: string
}

export interface DeptBusinessTripHistoryRow {
  empId: number
  empNo: string
  empName: string
  historyResponse: BusinessTripHistoryEntry
}

export interface DeptBusinessTripHistoryParams {
  keyword?: string
  approvalStatus?: ApprovalStatus
  yearMonth?: string
  page?: number
  size?: number
}

export interface MyBusinessTripHistoryParams {
  approvalStatus?: ApprovalStatus
  yearMonth?: string
}
