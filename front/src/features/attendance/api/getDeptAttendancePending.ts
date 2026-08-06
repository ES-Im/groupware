import { apiClient } from '@/shared/api/client'
import type { AttendanceStatus } from '../model/attendance'
import type { DeptAttendancePending } from '../model/deptAttendance'

export async function getDeptAttendancePending(
  deptId: number,
  params?: {
    status?: AttendanceStatus
    page?: number
    size?: number
  },
): Promise<DeptAttendancePending> {
  const query: Record<string, string | number> = {}
  if (params?.status) {
    query.status = params.status
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<DeptAttendancePending>(
    `/api/employees/attendances/${deptId}/monthly/pending`,
    { params: query },
  )
  return data
}
