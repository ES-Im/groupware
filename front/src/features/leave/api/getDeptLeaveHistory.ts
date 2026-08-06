import { apiClient } from '@/shared/api/client'
import type { DeptLeaveHistoryParams, DeptLeaveHistoryRow } from '../model/deptLeave'
import type { Page } from '../model/leave'

export async function getDeptLeaveHistory(
  deptId: number,
  params?: DeptLeaveHistoryParams,
): Promise<Page<DeptLeaveHistoryRow>> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.approvalStatus) {
    query.approvalStatus = params.approvalStatus
  }
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<Page<DeptLeaveHistoryRow>>(
    `/api/leaves/departments/${deptId}/request-history`,
    { params: query },
  )
  return data
}
