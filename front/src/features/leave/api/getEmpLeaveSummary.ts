import { apiClient } from '@/shared/api/client'
import type { EmpLeaveSummaryPage } from '../model/leave'

export async function getEmpLeaveSummary(params?: {
  keyword?: string
  deptId?: number
  year?: number
  page?: number
  size?: number
}): Promise<EmpLeaveSummaryPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.deptId != null) {
    query.deptId = params.deptId
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
  const { data } = await apiClient.get<EmpLeaveSummaryPage>('/api/employees/leaves/summary', {
    params: query,
  })
  return data
}
