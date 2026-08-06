import { apiClient } from '@/shared/api/client'
import type { MyAttendanceSummary } from '../model/attendance'

export async function getMyAttendanceMonthlySummary(params?: {
  yearMonth?: string
}): Promise<MyAttendanceSummary> {
  const query: Record<string, string> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  const { data } = await apiClient.get<MyAttendanceSummary>(
    '/api/employees/attendances/me/monthly/summary',
    { params: query },
  )
  return data
}
