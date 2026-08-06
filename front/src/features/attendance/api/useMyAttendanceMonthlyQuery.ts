import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { attendanceKeys } from '../model/queryKeys'
import type { AttendanceStatus } from '../model/attendance'
import { getMyAttendanceMonthly } from './getMyAttendanceMonthly'

export function useMyAttendanceMonthlyQuery(params?: {
  yearMonth?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: attendanceKeys.myMonthly(params),
    queryFn: () => getMyAttendanceMonthly(params),
    placeholderData: keepPreviousData,
  })
}
