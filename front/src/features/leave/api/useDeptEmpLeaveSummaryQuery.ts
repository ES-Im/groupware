import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { DeptLeaveSummaryParams } from '../model/deptLeave'
import { getDeptEmpLeaveSummary } from './getDeptEmpLeaveSummary'

/**
 * 부서원 휴가 요약 조회 훅(`DEPT_EMP_LEAVE_SUMMARY`, M4 T4.2, F745).
 * deptId 게이팅·placeholderData 정책은 `useDeptLeaveHistoryQuery`와 동일하다.
 */
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
