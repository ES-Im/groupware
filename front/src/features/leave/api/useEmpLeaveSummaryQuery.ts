import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getEmpLeaveSummary } from './getEmpLeaveSummary'

/**
 * 관리자 전사 사원 휴가 요약 조회 훅(`EMP_LEAVE_SUMMARY`, ROADMAP(LEAVE) M5 T5.1, F747).
 *
 * params(keyword/deptId/year/page/size)는 leaveKeys.empSummary(params)에 그대로 포함되어
 * 값이 바뀔 때마다 재요청된다. placeholderData: keepPreviousData로 검색·필터·페이지 변경 시
 * 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다(DeptAttendancePage 동일 패턴).
 */
export function useEmpLeaveSummaryQuery(params?: {
  keyword?: string
  deptId?: number
  year?: number
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: leaveKeys.empSummary(params),
    queryFn: () => getEmpLeaveSummary(params),
    placeholderData: keepPreviousData,
  })
}
