import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DeptBusinessTripHistoryParams } from '../model/businessTripHistory'
import { getDeptBusinessTripHistory } from './getDeptBusinessTripHistory'

export function useDeptBusinessTripHistoryQuery(
  deptId: number | undefined,
  params?: DeptBusinessTripHistoryParams,
) {
  return useQuery({
    queryKey: approvalKeys.deptBusinessTripHistory(deptId, params),
    queryFn: () => getDeptBusinessTripHistory(deptId!, params),
    enabled: deptId !== undefined,
    placeholderData: keepPreviousData,
  })
}
