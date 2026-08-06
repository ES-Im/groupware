import { useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { DeptLeaveUsageSummaryParams } from '../model/deptLeave'
import { getDeptLeaveUsageSummary } from './getDeptLeaveUsageSummary'

export function useDeptLeaveUsageSummaryQuery(
  deptId: number | undefined,
  params?: DeptLeaveUsageSummaryParams,
) {
  return useQuery({
    queryKey: leaveKeys.deptUsageSummary(deptId, params),
    queryFn: () => getDeptLeaveUsageSummary(deptId!, params),
    enabled: deptId !== undefined,
  })
}
