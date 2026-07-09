import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { attendanceKeys } from '../model/queryKeys'
import type { AttendanceStatus } from '../model/attendance'
import { getMyAttendanceMonthly } from './getMyAttendanceMonthly'

/**
 * 내 월별 근태 목록 조회 훅(`MY_ATTENDANCE_MONTHLY`, ROADMAP T1.4, F303).
 *
 * params(yearMonth/status/page/size)는 queryKey(attendanceKeys.myMonthly)에 그대로
 * 포함되어 값이 바뀔 때마다 재요청된다. placeholderData: keepPreviousData(board
 * useBoardListQuery·department useDepartmentsQuery와 동일 패턴)로 월/상태/페이지 변경 시
 * 새 응답이 도착하기 전까지 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다.
 */
export function useMyAttendanceMonthlyQuery(params?: {
  yearMonth?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: attendanceKeys.myMonthly(params),
    queryFn: () => getMyAttendanceMonthly(params),
    placeholderData: keepPreviousData,
  })
}
