import { useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { DeptLeaveUsageSummaryParams } from '../model/deptLeave'
import { getDeptLeaveUsageSummary } from './getDeptLeaveUsageSummary'

/**
 * 부서 연차 사용률 조회 훅(`DEPT_EMP_LEAVE_USAGE_SUMMARY`, M4 T4.2, F746).
 * 단일 값 조회라 페이지 전환에 따른 이전 값 유지(keepPreviousData)가 불필요하다 — year만 바뀌면
 * 즉시 재조회한다. deptId 게이팅은 다른 부서 축 훅과 동일하다.
 */
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
