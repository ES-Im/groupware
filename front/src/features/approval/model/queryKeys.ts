import type { DocumentBoxQueryParams } from './approval'
import type { DeptBusinessTripHistoryParams, MyBusinessTripHistoryParams } from './businessTripHistory'

export const approvalKeys = {
  all: ['approval'] as const,
  submitted: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'submitted', params] as const,
  unsubmitted: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'unsubmitted', params] as const,
  pending: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'pending', params] as const,
  accessible: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'accessible', params] as const,
  draftDetail: (draftId: number | undefined) =>
    [...approvalKeys.all, 'draftDetail', draftId] as const,
  summary: () => [...approvalKeys.all, 'summary'] as const,
  pendingCount: () => [...approvalKeys.all, 'pendingCount'] as const,
  deptBusinessTripHistory: (deptId: number | undefined, params?: DeptBusinessTripHistoryParams) =>
    [...approvalKeys.all, 'deptBusinessTripHistory', deptId, params] as const,
  myBusinessTripHistory: (params?: MyBusinessTripHistoryParams) =>
    [...approvalKeys.all, 'myBusinessTripHistory', params] as const,
}
