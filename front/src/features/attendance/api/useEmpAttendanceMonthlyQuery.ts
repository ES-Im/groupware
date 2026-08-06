import { useQuery } from '@tanstack/react-query'
import { attendanceKeys } from '../model/queryKeys'
import { getDeptAttendanceMonthly } from './getDeptAttendanceMonthly'

const EMP_RECORDS_LIST_SIZE = 100

export function useEmpAttendanceMonthlyQuery(
  deptId: number | undefined,
  empId: number | undefined,
  yearMonth: string,
  enabled: boolean,
) {
  const params = { yearMonth, size: EMP_RECORDS_LIST_SIZE }
  return useQuery({
    queryKey: attendanceKeys.deptMonthly(deptId, params),
    queryFn: () => getDeptAttendanceMonthly(deptId!, params),
    enabled: enabled && deptId != null && empId != null,
    select: (data) => data.content.find((row) => row.empInfo.empId === empId),
  })
}
