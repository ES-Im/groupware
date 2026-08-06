import { apiClient } from '@/shared/api/client'
import type { Page } from '../model/approval'
import type {
  DeptBusinessTripHistoryParams,
  DeptBusinessTripHistoryRow,
} from '../model/businessTripHistory'

export async function getDeptBusinessTripHistory(
  deptId: number,
  params?: DeptBusinessTripHistoryParams,
): Promise<Page<DeptBusinessTripHistoryRow>> {
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
  const { data } = await apiClient.get<Page<DeptBusinessTripHistoryRow>>(
    `/api/business-trips/departments/${deptId}/request-history`,
    { params: query },
  )
  return data
}
