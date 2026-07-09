import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 일반 기안 생성/상신 요청 body(F720, request-fields.adoc 실측). title/content 필수, approvers 선택.
 * 취소기안(F704)과 동일하게 객체 안 `approvers` 필드로 결재선을 감싼다(상신 F702만 최상위 배열).
 */
export interface GeneralDraftPayload {
  title: string
  content: string
  approvers?: ApproverParam[]
}

/** 일반 기안 생성/상신 응답(response-body.adoc 실측: 생성된 기안서 식별 번호). */
export interface GeneralDraftResult {
  draftId: number
}

/**
 * 일반 기안 생성 또는 생성+상신(F720, 활성 사원).
 *   - submit=false → `POST /api/drafts/generals`(생성=임시저장, `GENERAL_DRAFT_CREATE`)
 *   - submit=true  → `POST /api/drafts/generals/submission`(생성+상신, `GENERAL_DRAFT_CREATE_SUBMISSION`)
 * 두 엔드포인트는 동일 body/응답 계약을 공유한다(`201`, `{draftId}`). 실패(비활성 사원·상신 결재선
 * 규칙 위반 등)는 에러를 그대로 던져 호출부의 submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export async function createGeneralDraft(
  payload: GeneralDraftPayload,
  submit: boolean,
): Promise<GeneralDraftResult> {
  const url = submit ? '/api/drafts/generals/submission' : '/api/drafts/generals'
  const { data } = await apiClient.post<GeneralDraftResult>(url, payload)
  return data
}
