import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { MyLeaveHistoryParams } from '../model/myLeave'
import { getMyLeaveHistory } from './getMyLeaveHistory'

/**
 * 내 휴가 이력 조회 훅(`MY_LEAVE_REQUEST_HISTORY`, ROADMAP(LEAVE) M3 T3.1, F742).
 *
 * params(approvalStatus/yearMonth)는 queryKey(leaveKeys.myHistory)에 그대로 포함되어 값이 바뀔
 * 때마다 재요청된다. placeholderData: keepPreviousData(approval useMyBusinessTripHistoryQuery와
 * 동일 패턴)로 필터 변경 시 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다.
 */
export function useMyLeaveHistoryQuery(params?: MyLeaveHistoryParams) {
  return useQuery({
    queryKey: leaveKeys.myHistory(params),
    queryFn: () => getMyLeaveHistory(params),
    placeholderData: keepPreviousData,
  })
}
