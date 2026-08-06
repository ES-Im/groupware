import { useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { getDeptBusinessTripHistory } from './getDeptBusinessTripHistory'

const EMP_RECORDS_LIST_SIZE = 100

export function useEmpBusinessTripHistoryQuery(
  deptId: number | undefined,
  empId: number | undefined,
  yearMonth: string,
  enabled: boolean,
) {
  const params = { yearMonth, size: EMP_RECORDS_LIST_SIZE }
  return useQuery({
    queryKey: approvalKeys.deptBusinessTripHistory(deptId, params),
    queryFn: () => getDeptBusinessTripHistory(deptId!, params),
    enabled: enabled && deptId != null && empId != null,
    select: (data) => data.content.filter((row) => row.empId === empId),
  })
}
