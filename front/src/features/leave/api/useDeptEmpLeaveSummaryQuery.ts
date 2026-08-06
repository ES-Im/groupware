import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { DeptLeaveSummaryParams } from '../model/deptLeave'
import { getDeptEmpLeaveSummary } from './getDeptEmpLeaveSummary'

export function useDeptEmpLeaveSummaryQuery(
  deptId: number | undefined,
  params?: DeptLeaveSummaryParams,
) {
  return useQuery({
    queryKey: leaveKeys.deptSummary(deptId, params),
    queryFn: () => getDeptEmpLeaveSummary(deptId!, params),
    enabled: deptId !== undefined,
    placeholderData: keepPreviousData,
  })
}
