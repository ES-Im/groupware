import { apiClient } from '@/shared/api/client'
import type { AttendanceStatus, MyAttendance } from '../model/attendance'

export async function getMyAttendanceMonthly(params?: {
  yearMonth?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}): Promise<MyAttendance> {
  const query: Record<string, string | number> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  if (params?.status) {
    query.status = params.status
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<MyAttendance>('/api/employees/attendances/me/monthly', {
    params: query,
  })
  return data
}
