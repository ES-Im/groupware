import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 휴가 기안 생성/상신 요청 body(F740, request-fields.adoc 실측 — http-request.adoc 예시로 구조 확정).
 *
 * ⚠️ **혼합 구조(평탄화 금지)**: title/content/approvers는 `param` 객체 안에 중첩되고, 휴가 전용
 * 필드(startAt/endAt/leaveType)는 최상위 형제로 나란히 붙는다(③출장의 `param{...}` +
 * `startAt/endAt/destination/purpose/participantIds`와 동형 구조·필드만 다름 — ②일반 기안의
 * 평탄 `{title,content,approvers}`와 다름. ROADMAP §계약 실측 메모).
 */
export interface LeaveDraftPayload {
  param: {
    title: string
    content: string
    approvers?: ApproverParam[]
  }
  /** 휴가 시작 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  startAt: string
  /** 휴가 종료 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  endAt: string
  /** 휴가 유형 enum 코드(ANNUAL/HOURLY/SICK/OFFICIAL/COMPENSATORY/SPECIAL). */
  leaveType: string
}

/** 휴가 기안 생성/상신 응답(response-body.adoc 실측: 생성된 기안서 식별 번호). */
export interface LeaveDraftResult {
  draftId: number
}

/**
 * 휴가 기안 생성 또는 생성+상신(F740, 활성 사원).
 *   - submit=false → `POST /api/drafts/leaves`(생성=임시저장, `LEAVE_DRAFT_CREATE`)
 *   - submit=true  → `POST /api/drafts/leaves/submission`(생성+상신, `LEAVE_DRAFT_CREATE_SUBMISSION`)
 * 두 엔드포인트는 동일 body/응답 계약을 공유한다(`201`, `{draftId}`, `createBusinessTripDraft` 동형).
 * 실패(비활성 사원·상신 결재선 규칙 위반 등)는 에러를 그대로 던져 호출부의 submitWithErrorMapping이
 * handleApiError로 위임하도록 둔다.
 */
export async function createLeaveDraft(
  payload: LeaveDraftPayload,
  submit: boolean,
): Promise<LeaveDraftResult> {
  const url = submit ? '/api/drafts/leaves/submission' : '/api/drafts/leaves'
  const { data } = await apiClient.post<LeaveDraftResult>(url, payload)
  return data
}
