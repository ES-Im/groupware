import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 출장 기안 생성/상신 요청 body(F730, request-fields.adoc 실측 — http-request.adoc 예시로 구조 확정).
 *
 * ⚠️ **혼합 구조(평탄화 금지)**: title/content/approvers는 `param` 객체 안에 중첩되고, 출장 전용
 * 필드(startAt/endAt/destination/purpose/participantIds)는 최상위 형제로 나란히 붙는다
 * (②일반 기안의 평탄 `{title,content,approvers}`와 다름 — ROADMAP §계약 실측 메모).
 */
export interface BusinessTripDraftPayload {
  param: {
    title: string
    content: string
    approvers?: ApproverParam[]
  }
  /** 출장 시작 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  startAt: string
  /** 출장 종료 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  endAt: string
  destination: string
  purpose: string
  participantIds?: number[]
}

/** 출장 기안 생성/상신 응답(response-body.adoc 실측: 생성된 기안서 식별 번호). */
export interface BusinessTripDraftResult {
  draftId: number
}

/**
 * 출장 기안 생성 또는 생성+상신(F730, 활성 사원).
 *   - submit=false → `POST /api/drafts/business-trips`(생성=임시저장, `BUSINESS_TRIP_DRAFT_CREATE`)
 *   - submit=true  → `POST /api/drafts/business-trips/submission`(생성+상신, `BUSINESS_TRIP_DRAFT_CREATE_SUBMISSION`)
 * 두 엔드포인트는 동일 body/응답 계약을 공유한다(`201`, `{draftId}`, `createGeneralDraft` 동형). 실패
 * (비활성 사원·상신 결재선 규칙 위반 등)는 에러를 그대로 던져 호출부의 submitWithErrorMapping이
 * handleApiError로 위임하도록 둔다.
 */
export async function createBusinessTripDraft(
  payload: BusinessTripDraftPayload,
  submit: boolean,
): Promise<BusinessTripDraftResult> {
  const url = submit ? '/api/drafts/business-trips/submission' : '/api/drafts/business-trips'
  const { data } = await apiClient.post<BusinessTripDraftResult>(url, payload)
  return data
}
