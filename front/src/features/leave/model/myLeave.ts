import type { ApprovalStatus } from '@/features/approval/model/approval'

/**
 * 내 휴가 신청 이력 1건(`MY_LEAVE_REQUEST_HISTORY`, F742, ROADMAP(LEAVE) M3 T3.1).
 * 필드는 back/build/generated-snippets/MY_LEAVE_REQUEST_HISTORY/response-fields.adoc 실측 기준(추측 금지).
 * leaveType/approvalStatus는 enum 코드가 아니라 서버 표시명 문자열이다("연차"/"반차", "결재대기" 등) —
 * 작성 요청 body의 leaveType(enum 코드)과 다르므로 클라 매핑 없이 그대로 렌더한다(ROADMAP(LEAVE)
 * §PRD에서 확정된 결정 "LeaveType enum 코드 vs 이력 표시명" 참조).
 */
export interface MyLeaveHistoryEntry {
  draftId: number
  leaveType: string
  startAt: string
  endAt: string
  requestedLeaveDays: number
  approvalStatus: string
}

/**
 * `MY_LEAVE_REQUEST_HISTORY` 쿼리 파라미터(둘 다 선택, query-parameters.adoc 실측).
 * approvalStatus는 응답 표시 문자열이 아니라 ApprovalStatus enum 코드로 전송한다(approval 도메인
 * ApprovalStatus 재사용 — 신규 타입 발명 금지). yearMonth(yyyy-MM)는 미입력 시 서버가 현재 월로 응답한다.
 */
export interface MyLeaveHistoryParams {
  approvalStatus?: ApprovalStatus
  yearMonth?: string
}

/**
 * 내 잔여 휴가 요약(`MY_EMP_LEAVE_SUMMARY`, F743, ROADMAP(LEAVE) M3 T3.1) 응답 타입.
 * 필드는 back/build/generated-snippets/MY_EMP_LEAVE_SUMMARY/response-fields.adoc 실측 기준(추측 금지).
 * 배열이 아닌 단일 객체다. 잔여(연차/특별/포상)는 서버가 내려주지 않아 호출부가 부여−사용으로
 * 프론트에서 계산한다(ROADMAP(LEAVE) §PRD에서 확정된 결정).
 */
export interface MyLeaveSummary {
  annualBaseGrantDays: number
  annualUsedDays: number
  specialGrantDays: number
  specialUsedDays: number
  compensatoryGrantDays: number
  compensatoryUsedDays: number
}
