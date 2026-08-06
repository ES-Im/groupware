import type { ApprovalStatus } from '@/features/approval/model/approval'

export interface MyLeaveHistoryEntry {
  draftId: number
  leaveType: string
  startAt: string
  endAt: string
  requestedLeaveDays: number
  approvalStatus: string
}

export interface MyLeaveHistoryParams {
  approvalStatus?: ApprovalStatus
  yearMonth?: string
}

export interface MyLeaveSummary {
  annualBaseGrantDays: number
  annualUsedDays: number
  specialGrantDays: number
  specialUsedDays: number
  compensatoryGrantDays: number
  compensatoryUsedDays: number
}
