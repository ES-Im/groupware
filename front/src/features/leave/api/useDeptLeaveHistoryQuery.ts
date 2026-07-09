import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { DeptLeaveHistoryParams } from '../model/deptLeave'
import { getDeptLeaveHistory } from './getDeptLeaveHistory'

/**
 * 부서 휴가 신청 이력 조회 훅(`DEPT_LEAVE_REQUEST_HISTORY`, M4 T4.1, F744).
 *
 * deptId는 `usePrimaryDeptId()`(strict, 폴백 없음)의 도출 결과로 number | undefined다. deptId가
 * 아직 확정되지 않은 동안(undefined)에는 `enabled:false`로 대기해 잘못된 경로로 요청하지 않는다
 * (approval `useDeptBusinessTripHistoryQuery` 동형).
 *
 * params(keyword/approvalStatus/yearMonth/page/size)는 queryKey(`leaveKeys.deptHistory`)에 그대로
 * 포함되어 값이 바뀔 때마다 재요청된다. placeholderData: keepPreviousData로 필터·페이지 변경 시
 * 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다.
 */
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
