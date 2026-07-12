import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { AttendanceStatus } from '../model/attendance'
import { attendanceKeys } from '../model/queryKeys'
import { getDeptAttendancePending } from './getDeptAttendancePending'

/**
 * 부서 승인 대기 근태 목록 조회 훅(`DEPT_ATTENDANCE_PENDING`, ROADMAP T3.3, F306).
 *
 * deptId는 T3.2(usePrimaryDeptId)의 엄격 도출 결과로 number | undefined다. deptId가
 * 아직 확정되지 않은 동안(undefined)에는 `enabled: false`로 대기해 잘못된 경로
 * (`/monthly/pending` path param 누락)로 요청하지 않는다.
 *
 * params(status/page/size)는 queryKey(attendanceKeys.deptPending)에 그대로 포함되어 값이
 * 바뀔 때마다 재요청된다. status는 DEPT_ATTENDANCE_MONTHLY와 동일한 단일값 AttendanceStatus
 * 필터로 백엔드에 곧 추가될 예정이라 미리 전달 경로를 열어둔다(getDeptAttendancePending 참고 —
 * 서버가 아직 처리하지 않는 동안은 조용히 무시된다). placeholderData: keepPreviousData로 페이지/
 * 필터 변경 시 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다
 * (useDeptAttendanceMonthlyQuery와 동일 패턴).
 */
export function useDeptAttendancePendingQuery(
  deptId: number | undefined,
  params?: {
    status?: AttendanceStatus
    page?: number
    size?: number
  },
) {
  return useQuery({
    queryKey: attendanceKeys.deptPending(deptId, params),
    queryFn: () => getDeptAttendancePending(deptId!, params),
    enabled: deptId !== undefined,
    placeholderData: keepPreviousData,
  })
}
