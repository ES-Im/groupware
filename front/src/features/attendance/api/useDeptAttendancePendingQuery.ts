import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { AttendanceStatus } from '../model/attendance'
import { attendanceKeys } from '../model/queryKeys'
import { getDeptAttendancePending } from './getDeptAttendancePending'

export function useDeptAttendancePendingQuery(
  deptId: number | undefined,
  params?: {
    status?: AttendanceStatus
    page?: number
    size?: number
  },
) {
  return useQuery({
    queryKey: attendanceKeys.deptPending(deptId, params),
    queryFn: () => getDeptAttendancePending(deptId!, params),
    enabled: deptId !== undefined,
    placeholderData: keepPreviousData,
  })
}
