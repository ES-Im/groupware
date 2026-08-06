import { useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getDeptLeaveHistory } from './getDeptLeaveHistory'

const EMP_RECORDS_LIST_SIZE = 100

export function useEmpLeaveHistoryQuery(
  deptId: number | undefined,
  empId: number | undefined,
  yearMonth: string,
  enabled: boolean,
) {
  const params = { yearMonth, size: EMP_RECORDS_LIST_SIZE }
  return useQuery({
    queryKey: leaveKeys.deptHistory(deptId, params),
    queryFn: () => getDeptLeaveHistory(deptId!, params),
    enabled: enabled && deptId != null && empId != null,
    select: (data) => data.content.filter((row) => row.empId === empId),
  })
}
