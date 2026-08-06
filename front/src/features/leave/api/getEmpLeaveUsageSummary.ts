import { apiClient } from '@/shared/api/client'
import type { LeaveUsageSummary } from '../model/leave'

export async function getEmpLeaveUsageSummary(params?: {
  deptId?: number
  year?: number
}): Promise<LeaveUsageSummary> {
  const query: Record<string, number> = {}
  if (params?.deptId != null) {
    query.deptId = params.deptId
  }
  if (params?.year != null) {
    query.year = params.year
  }
  const { data } = await apiClient.get<LeaveUsageSummary>('/api/employees/leaves/usage-summary', {
    params: query,
  })
  return data
}
