import { apiClient } from '@/shared/api/client'
import type { DeptLeaveUsageSummaryParams } from '../model/deptLeave'
import type { LeaveUsageSummary } from '../model/leave'

export async function getDeptLeaveUsageSummary(
  deptId: number,
  params?: DeptLeaveUsageSummaryParams,
): Promise<LeaveUsageSummary> {
  const query: Record<string, number> = {}
  if (params?.year != null) {
    query.year = params.year
  }
  const { data } = await apiClient.get<LeaveUsageSummary>(
    `/api/departments/${deptId}/employees/leaves/usage-summary`,
    { params: query },
  )
  return data
}
