import type { AttendanceStatus } from './attendance'

/**
 * attendance 도메인 queryKey 팩토리(ROADMAP T1.2 / §참조 계약 매핑 / §기술 스택).
 * board/employee 도메인(boardKeys/employeeKeys)과 동형 구조 — all을 배열 리터럴로
 * 고정해 invalidateQueries(attendanceKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * myMonthly(F303)/mySummary(F304)는 T1.4가 실제로 소비한다. status 파라미터는
 * T1.2 작성 시점엔 T1.1(AttendanceStatus enum)과 병렬 진행 중이라 string으로 최소
 * 정의했으나, T1.1이 먼저 완료되어 이제 정식 AttendanceStatus로 연결한다.
 *
 * deptMonthly(F305)/deptPending(F306) 부서 축은 T3.3이 확장 추가했다(재구축 아님).
 * deptId는 T3.2의 게이팅(enabled:false)과 동일하게 number | undefined를 받는
 * 컨벤션을 따른다(boardKeys.detail과 동일 이유).
 */

interface MyMonthlyParams {
  yearMonth?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}

/**
 * DEPT_ATTENDANCE_MONTHLY(F305) 쿼리 파라미터. query-parameters.adoc 실측대로
 * yearMonth/keyword/status/page/size 전부 optional이다.
 */
interface DeptMonthlyParams {
  yearMonth?: string
  keyword?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}

/**
 * DEPT_ATTENDANCE_PENDING(F306) 쿼리 파라미터. query-parameters.adoc 실측 기준은 아직
 * page/size뿐이지만, 백엔드가 DEPT_ATTENDANCE_MONTHLY와 동일한 단일값 `status` 필터를 추가할
 * 예정이라(front/CLAUDE.md 계약 우선 원칙과 별개로, 이 필드는 사용자 확인 하에 선반영) 미리
 * 타입에 반영해둔다. 백엔드가 실제로 이 파라미터를 바인딩하기 전까지는 요청에 실려도 서버가
 * 조용히 무시한다(요청/쿼리 자체는 실패하지 않는다).
 */
interface DeptPendingParams {
  status?: AttendanceStatus
  page?: number
  size?: number
}

export const attendanceKeys = {
  all: ['attendance'] as const,
  myMonthly: (params?: MyMonthlyParams) =>
    [...attendanceKeys.all, 'myMonthly', params] as const,
  mySummary: (yearMonth?: string) => [...attendanceKeys.all, 'mySummary', yearMonth] as const,
  /**
   * T3.3(F305). deptId는 T3.2 게이팅 계약과 동일하게 number | undefined를 받는다
   * (boardKeys.detail과 동일 이유 — deptId 미확정 시에도 키 구조 자체는 안정적으로 유지).
   */
  deptMonthly: (deptId: number | undefined, params?: DeptMonthlyParams) =>
    [...attendanceKeys.all, 'dept', deptId, 'monthly', params] as const,
  /** T3.3(F306). */
  deptPending: (deptId: number | undefined, params?: DeptPendingParams) =>
    [...attendanceKeys.all, 'dept', deptId, 'pending', params] as const,
}
