import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getEmpLeaveUsageSummary } from './getEmpLeaveUsageSummary'

/**
 * 관리자 회사/부서 연차 사용률 조회 훅(`EMP_LEAVE_USAGE_SUMMARY`, ROADMAP(LEAVE) M5 T5.1, F748).
 *
 * params(deptId/year)는 leaveKeys.empUsageSummary(params)에 그대로 포함되어 값이 바뀔 때마다
 * 재요청된다. placeholderData: keepPreviousData로 부서/연도 변경 시 이전 카드 값을 유지해
 * 깜빡임을 막는다(useMyLeaveSummaryQuery와 동일 톤).
 */
export function useEmpLeaveUsageSummaryQuery(params?: { deptId?: number; year?: number }) {
  return useQuery({
    queryKey: leaveKeys.empUsageSummary(params),
    queryFn: () => getEmpLeaveUsageSummary(params),
    placeholderData: keepPreviousData,
  })
}
