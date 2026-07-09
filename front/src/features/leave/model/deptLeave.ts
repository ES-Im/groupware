import type { ApprovalStatus } from '@/features/approval/model/approval'
import type { MyLeaveHistoryEntry } from './myLeave'

/**
 * `DEPT_LEAVE_REQUEST_HISTORY`(F744, ROADMAP(LEAVE) M4 T4.1) 응답 `content[]` 원소 1건.
 * 사원 식별(`empId`/`empNo`/`empName`) + 휴가 신청 이력(`historyResponse`)로 구성된다(실측 기준,
 * `back/build/generated-snippets/DEPT_LEAVE_REQUEST_HISTORY/response-fields.adoc`).
 * `historyResponse` 하위 필드(draftId/leaveType/startAt/endAt/requestedLeaveDays/approvalStatus)는
 * `MY_LEAVE_REQUEST_HISTORY`(M3)의 `MyLeaveHistoryEntry`와 완전히 동형이라 그대로 재사용한다(신규
 * 타입 발명 금지 — approval `DeptBusinessTripHistoryRow`가 `BusinessTripHistoryEntry`를 재사용하는
 * 것과 동일 패턴).
 */
export interface DeptLeaveHistoryRow {
  empId: number
  empNo: string
  empName: string
  historyResponse: MyLeaveHistoryEntry
}

/**
 * `DEPT_LEAVE_REQUEST_HISTORY` 쿼리 파라미터(전부 선택, `query-parameters.adoc` 실측).
 * `approvalStatus`는 응답 표시 문자열이 아니라 `ApprovalStatus` enum 코드로 전송한다(approval 도메인
 * 재사용 — 신규 타입 발명 금지). `yearMonth`(`yyyy-MM`)는 미입력 시 서버가 현재 월로 응답한다.
 */
export interface DeptLeaveHistoryParams {
  keyword?: string
  approvalStatus?: ApprovalStatus
  yearMonth?: string
  page?: number
  size?: number
}

/**
 * `DEPT_EMP_LEAVE_SUMMARY`(F745, M4 T4.2) 쿼리 파라미터(전부 선택, `query-parameters.adoc` 실측).
 * 응답 자체는 `EmpLeaveSummaryRow`/`EmpLeaveSummaryPage`(`model/leave.ts`, M5 T5.1이 먼저 정의)와
 * 완전히 동형이라 재사용한다 — `deptId`는 path param이라 쿼리 파라미터에는 없다(`EMP_LEAVE_SUMMARY`의
 * 선택적 `deptId` 쿼리와의 차이).
 */
export interface DeptLeaveSummaryParams {
  keyword?: string
  year?: number
  page?: number
  size?: number
}

/**
 * `DEPT_EMP_LEAVE_USAGE_SUMMARY`(F746, M4 T4.2) 쿼리 파라미터(선택, 미입력 시 서버가 현재 연도로
 * 응답). 응답 자체는 `LeaveUsageSummary`(`model/leave.ts`)와 동형이라 재사용한다.
 */
export interface DeptLeaveUsageSummaryParams {
  year?: number
}
