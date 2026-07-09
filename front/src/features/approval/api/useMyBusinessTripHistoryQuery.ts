import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { MyBusinessTripHistoryParams } from '../model/businessTripHistory'
import { getMyBusinessTripHistory } from './getMyBusinessTripHistory'

/**
 * 내 출장 이력 조회 훅(`MY_BUSINESS_TRIP_REQUEST_HISTORY`, M4 T4.1, F733).
 *
 * params(approvalStatus/yearMonth)는 queryKey(approvalKeys.myBusinessTripHistory)에 그대로
 * 포함되어 값이 바뀔 때마다 재요청된다. placeholderData: keepPreviousData(useDeptBusinessTripHistoryQuery와
 * 동일 패턴)로 필터 변경 시 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다.
 */
export function useMyBusinessTripHistoryQuery(params?: MyBusinessTripHistoryParams) {
  return useQuery({
    queryKey: approvalKeys.myBusinessTripHistory(params),
    queryFn: () => getMyBusinessTripHistory(params),
    placeholderData: keepPreviousData,
  })
}
