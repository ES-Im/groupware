import type { ApprovalStatus } from './approval'

/**
 * 출장 신청 이력 1건(부서 출장 이력 `DEPT_BUSINESS_TRIP_REQUEST_HISTORY`의 `content[].historyResponse`
 * 실측 기준, `back/build/generated-snippets/DEPT_BUSINESS_TRIP_REQUEST_HISTORY/response-fields.adoc`).
 * `startAt`/`endAt`은 date-only(`yyyy-MM-dd`)다 — 작성/수정 요청의 datetime과 다르다(추측 금지).
 */
export interface BusinessTripHistoryEntry {
  draftId: number
  startAt: string
  endAt: string
  destination: string
  purpose: string
  /** 결재 상태 표시명 문자열(`resolveApprovalStatus`/`getApprovalStatusBadge`로 배지 매핑). */
  approvalStatus: string
}

/**
 * `DEPT_BUSINESS_TRIP_REQUEST_HISTORY`(F734) 응답 `content[]` 원소 1건.
 * 사원 식별(`empId`/`empNo`/`empName`) + 출장 신청 이력(`historyResponse`)로 구성된다(실측 기준).
 */
export interface DeptBusinessTripHistoryRow {
  empId: number
  empNo: string
  empName: string
  historyResponse: BusinessTripHistoryEntry
}

/**
 * `DEPT_BUSINESS_TRIP_REQUEST_HISTORY` 쿼리 파라미터(전부 선택, `query-parameters.adoc` 실측).
 * `approvalStatus`는 응답 표시 문자열이 아니라 enum 코드로 전송한다(§계약 실측 메모).
 * `yearMonth`는 `yyyy-MM` 형식이며 미입력 시 서버가 현재 월로 응답한다.
 */
export interface DeptBusinessTripHistoryParams {
  keyword?: string
  approvalStatus?: ApprovalStatus
  yearMonth?: string
  page?: number
  size?: number
}

/**
 * `MY_BUSINESS_TRIP_REQUEST_HISTORY`(F733, ROADMAP(DRAFT-BUSINESSTRIP) T4.1) 쿼리 파라미터
 * (둘 다 선택, `query-parameters.adoc` 실측). `DeptBusinessTripHistoryParams`의 `keyword`/`page`/`size` 없는
 * 부분집합이다 — 내 이력은 페이징 없는 배열 응답이라 page/size가 없고, 본인 조회라 keyword도 없다.
 * `approvalStatus`는 응답 표시 문자열이 아니라 enum 코드로 전송한다. `yearMonth`는 미입력 시 서버가
 * 현재 월로 응답한다.
 */
export interface MyBusinessTripHistoryParams {
  approvalStatus?: ApprovalStatus
  yearMonth?: string
}
