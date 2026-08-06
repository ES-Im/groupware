import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { attendanceKeys } from '../model/queryKeys'
import type { AttendanceStatus } from '../model/attendance'
import { getDeptAttendanceMonthly } from './getDeptAttendanceMonthly'

export function useDeptAttendanceMonthlyQuery(
  deptId: number | undefined,
  params?: {
    yearMonth?: string
    keyword?: string
    status?: AttendanceStatus
    page?: number
    size?: number
  },
) {
  return useQuery({
    queryKey: attendanceKeys.deptMonthly(deptId, params),
    queryFn: () => getDeptAttendanceMonthly(deptId!, params),
    enabled: deptId !== undefined,
    placeholderData: keepPreviousData,
  })
}
