import { apiClient } from '@/shared/api/client'
import type { DeptLeaveSummaryParams } from '../model/deptLeave'
import type { EmpLeaveSummaryPage } from '../model/leave'

export async function getDeptEmpLeaveSummary(
  deptId: number,
  params?: DeptLeaveSummaryParams,
): Promise<EmpLeaveSummaryPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.year != null) {
    query.year = params.year
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<EmpLeaveSummaryPage>(
    `/api/departments/${deptId}/employees/leaves/summary`,
    { params: query },
  )
  return data
}
