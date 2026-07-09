import type { DeptLeaveHistoryParams, DeptLeaveSummaryParams, DeptLeaveUsageSummaryParams } from './deptLeave'
import type { MyLeaveHistoryParams } from './myLeave'

/**
 * leave(휴가) 도메인 queryKey 팩토리 최초 생성(ROADMAP(LEAVE) M3 T3.1).
 * board/attendance/approval 도메인(boardKeys/attendanceKeys/approvalKeys)과 동형 구조 — all을
 * 배열 리터럴로 고정해 invalidateQueries(leaveKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * myHistory(F742)/mySummary(F743)는 M3 T3.1이 소비한다. empSummary(F747)/empUsageSummary(F748)는
 * M5 T5.1이 전사 축으로 확장 추가했다(attendanceKeys의 my→dept 확장 패턴 동형, 재설계 없음).
 * deptHistory(F744)/deptSummary(F745)/deptUsageSummary(F746)는 M4 T4.1/T4.2가 부서 축으로 확장
 * 추가했다(동일 확장 패턴, 재구축 없음).
 */

interface EmpSummaryParams {
  keyword?: string
  deptId?: number
  year?: number
  page?: number
  size?: number
}

interface EmpUsageSummaryParams {
  deptId?: number
  year?: number
}

export const leaveKeys = {
  all: ['leave'] as const,
  myHistory: (params?: MyLeaveHistoryParams) => [...leaveKeys.all, 'myHistory', params] as const,
  mySummary: (year?: number) => [...leaveKeys.all, 'mySummary', year] as const,
  /** EMP_LEAVE_SUMMARY(F747, M5 T5.1). */
  empSummary: (params?: EmpSummaryParams) => [...leaveKeys.all, 'emp', 'summary', params] as const,
  /** EMP_LEAVE_USAGE_SUMMARY(F748, M5 T5.1). */
  empUsageSummary: (params?: EmpUsageSummaryParams) =>
    [...leaveKeys.all, 'emp', 'usageSummary', params] as const,
  /**
   * DEPT_LEAVE_REQUEST_HISTORY(F744, M4 T4.1). deptId는 usePrimaryDeptId(strict) 게이팅 계약과
   * 동일하게 number | undefined를 받는다(approvalKeys.deptBusinessTripHistory와 동일 이유 — deptId
   * 미확정 시에도 키 구조는 안정적으로 유지).
   */
  deptHistory: (deptId: number | undefined, params?: DeptLeaveHistoryParams) =>
    [...leaveKeys.all, 'dept', deptId, 'history', params] as const,
  /** DEPT_EMP_LEAVE_SUMMARY(F745, M4 T4.2). */
  deptSummary: (deptId: number | undefined, params?: DeptLeaveSummaryParams) =>
    [...leaveKeys.all, 'dept', deptId, 'summary', params] as const,
  /** DEPT_EMP_LEAVE_USAGE_SUMMARY(F746, M4 T4.2). */
  deptUsageSummary: (deptId: number | undefined, params?: DeptLeaveUsageSummaryParams) =>
    [...leaveKeys.all, 'dept', deptId, 'usageSummary', params] as const,
}
