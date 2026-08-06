import { apiClient } from '@/shared/api/client'
import type { MyLeaveSummary } from '../model/myLeave'

export async function getMyLeaveSummary(params?: { year?: number }): Promise<MyLeaveSummary> {
  const query: Record<string, number> = {}
  if (params?.year != null) {
    query.year = params.year
  }
  const { data } = await apiClient.get<MyLeaveSummary>('/api/employees/me/leaves/summary', {
    params: query,
  })
  return data
}
