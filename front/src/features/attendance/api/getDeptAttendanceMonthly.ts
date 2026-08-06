import { apiClient } from '@/shared/api/client'
import type { AttendanceStatus } from '../model/attendance'
import type { DeptAttendanceMonthly } from '../model/deptAttendance'

export async function getDeptAttendanceMonthly(
  deptId: number,
  params?: {
    yearMonth?: string
    keyword?: string
    status?: AttendanceStatus
    page?: number
    size?: number
  },
): Promise<DeptAttendanceMonthly> {
  const query: Record<string, string | number> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  if (params?.keyword) {
    query.keyword = params.keyword
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
  const { data } = await apiClient.get<DeptAttendanceMonthly>(
    `/api/employees/attendances/${deptId}/monthly`,
    { params: query },
  )
  return data
}
