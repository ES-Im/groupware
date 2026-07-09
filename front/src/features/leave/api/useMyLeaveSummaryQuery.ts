import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getMyLeaveSummary } from './getMyLeaveSummary'

/**
 * 내 잔여 휴가 요약 조회 훅(`MY_EMP_LEAVE_SUMMARY`, ROADMAP(LEAVE) M3 T3.1, F743).
 *
 * year가 바뀔 때마다 leaveKeys.mySummary(year)로 재요청된다. placeholderData: keepPreviousData로
 * 연도 변경 시 이전 카드 값을 유지해 깜빡임을 막는다(useMyLeaveHistoryQuery와 동일 톤).
 */
export function useMyLeaveSummaryQuery(year?: number) {
  return useQuery({
    queryKey: leaveKeys.mySummary(year),
    queryFn: () => getMyLeaveSummary({ year }),
    placeholderData: keepPreviousData,
  })
}
