import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { DeptLeaveHistoryParams } from '../model/deptLeave'
import { getDeptLeaveHistory } from './getDeptLeaveHistory'

export function useDeptLeaveHistoryQuery(
  deptId: number | undefined,
  params?: DeptLeaveHistoryParams,
) {
  return useQuery({
    queryKey: leaveKeys.deptHistory(deptId, params),
    queryFn: () => getDeptLeaveHistory(deptId!, params),
    enabled: deptId !== undefined,
    placeholderData: keepPreviousData,
  })
}
