/**
 * 기안서 상세 조회(`DRAFT_DETAIL`, F701) 응답 타입.
 * 필드는 `back/build/generated-snippets/DRAFT_DETAIL/response-fields.adoc` 실측 기준(추측 금지).
 * **이 타입은 F702~F719(M3 결재자 액션·M4 기안자 액션·M5 공람·M6 첨부)가 전부 재사용하는 기반**이다 —
 * 전자결재 도메인 상세 화면의 관문.
 *
 * 유형별 본문은 `leave`/`businessTrip`/`sales` 중 하나만 non-null이고 나머지는 null이다(GENERAL은 셋 다
 * null). 유형 분기는 `draftType` enum 값이 아니라 **non-null 슬롯 체크**로 처리한다(Open Q#2 — draftType
 * 정규 enum 값 집합·취소기안 유형 표기 미확정 회피). 취소기안은 `sourceDraftId`로 원본 기안을 링크한다.
 */

/** 기안자/결재자/공람자/참여자 공통 사원 참조(empId+empName). */
export interface DraftEmployeeRef {
  empId: number
  empName: string
}

/**
 * 결재선 1인(approvers[]). role은 서버가 enum 이름("APPROVER"/"COOPERATOR")을 그대로 내려준다
 * (ApprovalRole.java 실측 — 라벨 변환은 lib/approvalStatusBadge.ts getApprovalRoleLabel).
 * approvedAt/rejectedAt/rejectReason은 미처리 시 null(response-fields.adoc "미처리 시 null").
 */
export interface DraftApprover {
  empId: number
  empName: string
  role: string
  order: number
  approvedAt: string | null
  rejectedAt: string | null
  rejectReason: string | null
}

/** 공람자 1인(circulations[]). readAt은 미열람 시 null. */
export interface DraftCirculation {
  empId: number
  empName: string
  readAt: string | null
}

/** 첨부파일 1건(files[]). 파일 정책은 file-upload.md + 도메인모델 관할(M6에서 소비). */
export interface DraftFile {
  fileId: number
  originalName: string
  mimeType: string
  extension: string
  fileSize: number
}

/**
 * 출장기안 유형 슬롯(`businessTrip`). 하위필드는 DRAFT_DETAIL 스니펫 실측(관측 예시가 BUSINESS_TRIP).
 * 본문 렌더 컴포넌트는 ③출장 작성 PRD가 소유하며, 이번 공통 M2는 "준비 중" 폴백으로만 처리한다.
 */
export interface BusinessTripSlot {
  startAt: string
  endAt: string
  destination: string
  purpose: string
  participants: DraftEmployeeRef[]
}

/**
 * 휴가기안 유형 슬롯(`leave`). 백엔드 DTO(`DraftDetailResponse.LeaveDraftDetail`) 소스 대조로
 * 하위필드를 확정했다(ROADMAP(LEAVE) T2.1, Open Q#4 해결): `record LeaveDraftDetail(LocalDateTime
 * startAt, LocalDateTime endAt, LeaveType leaveType, Long reservedHours)`. `leaveType`은
 * `LeaveType.java`에 `@JsonValue`가 없어 **enum 코드 그대로**("ANNUAL" 등) 내려온다(이력 목록
 * `MY_/DEPT_LEAVE_REQUEST_HISTORY`의 표시명 문자열과 다르므로 혼동 주의). 본문 렌더(`LeaveDraftBody`)·
 * 수정 프리필(`LeaveDraftEditPage`)·판별(`isLeaveDraft`)이 소비한다.
 */
export interface LeaveSlot {
  startAt: string
  endAt: string
  leaveType: string
  reservedHours: number
}

/**
 * 매출기안 유형 슬롯(`sales`). leave와 동일 사유로 하위필드 미확정(Open Q#5). 실제 하위필드
 * (매출 작성 request-fields 추정: franchiseId/reportMonth/salesAmount)는 ⑤매출 작성 PRD가 소유한다.
 */
export type SalesSlot = Record<string, unknown>

export interface DraftDetailResponse {
  draftId: number
  /**
   * 기안 유형 문자열(관측값 "BUSINESS_TRIP"; GENERAL/LEAVE/SALES 추정). **정규 enum 값 집합 미확정
   * (Open Q#2)** — 유형 분기는 이 값이 아니라 leave/businessTrip/sales non-null 체크로 한다.
   */
  draftType: string
  drafter: DraftEmployeeRef
  title: string
  content: string
  /**
   * 상신 일시(`yyyy-MM-dd'T'HH:mm:ss`). 스니펫 예시는 상신 완료 기안이라 String이지만, 임시저장함
   * (UNSUBMITTED)에서 진입한 미상신 기안은 아직 상신 전이라 null이다(목록 DocumentBoxRow.submittedAt과
   * 동일 정책) → string | null로 둔다. 표기는 formatDraftDateTime이 null을 대시로 처리한다.
   */
  submittedAt: string | null
  /** 결재 상태 표시명 문자열(예 "결재진행중"). 코드가 아님 — getApprovalStatusBadge로 배지 매핑. */
  approvalStatus: string
  files: DraftFile[]
  approvers: DraftApprover[]
  circulations: DraftCirculation[]
  /** 취소기안인 경우 원본 기안서 식별 번호. 원본 기안이면 null. */
  sourceDraftId: number | null
  /** 원본 기안인 경우 취소기안 식별 번호. 취소기안이 없으면 null. */
  cancellationDraftId: number | null
  /** 취소기안 상신 일시. 없으면 null. */
  cancellationSubmittedAt: string | null
  /** 유형 슬롯: 셋 중 하나만 non-null(GENERAL은 셋 다 null). */
  leave: LeaveSlot | null
  businessTrip: BusinessTripSlot | null
  sales: SalesSlot | null
}
