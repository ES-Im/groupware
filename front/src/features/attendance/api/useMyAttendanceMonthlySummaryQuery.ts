import { useQuery } from '@tanstack/react-query'
import { attendanceKeys } from '../model/queryKeys'
import { getMyAttendanceMonthlySummary } from './getMyAttendanceMonthlySummary'

/**
 * 내 월별 근태 요약 조회 훅(`MY_ATTENDANCE_MONTHLY_SUMMARY`, ROADMAP T1.4, F304).
 *
 * yearMonth는 queryKey(attendanceKeys.mySummary)에 그대로 포함되어 값이 바뀔 때마다
 * 재요청된다. 단일 객체 응답이라 목록 훅과 달리 페이지네이션 깜빡임 이슈가 없어
 * placeholderData: keepPreviousData는 적용하지 않는다.
 */
export function useMyAttendanceMonthlySummaryQuery(params?: { yearMonth?: string }) {
  return useQuery({
    queryKey: attendanceKeys.mySummary(params?.yearMonth),
    queryFn: () => getMyAttendanceMonthlySummary(params),
  })
}
