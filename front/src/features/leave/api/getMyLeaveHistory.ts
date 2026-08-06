import { apiClient } from '@/shared/api/client'
import type { MyLeaveHistoryEntry, MyLeaveHistoryParams } from '../model/myLeave'

export async function getMyLeaveHistory(
  params?: MyLeaveHistoryParams,
): Promise<MyLeaveHistoryEntry[]> {
  const query: Record<string, string> = {}
  if (params?.approvalStatus) {
    query.approvalStatus = params.approvalStatus
  }
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  const { data } = await apiClient.get<MyLeaveHistoryEntry[]>(
    '/api/leaves/employees/me/request-history',
    { params: query },
  )
  return data
}
