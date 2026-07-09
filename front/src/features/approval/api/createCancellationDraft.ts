import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 취소 기안 생성/상신 요청 body(F704, request-fields.adoc 실측). title/content 필수, approvers 선택.
 * 상신(F702)의 body가 최상위 배열인 것과 달리, 취소기안은 객체 안 `approvers` 필드로 감싼다.
 */
export interface CancellationDraftPayload {
  title: string
  content: string
  approvers?: ApproverParam[]
}

/** 취소 기안 생성/상신 응답(response-fields.adoc 실측: 생성된 기안서 식별 번호). */
export interface CancellationDraftResult {
  draftId: number
}

/**
 * 취소 기안 생성 또는 생성+상신(F704, 기안자 본인, APPROVED 원본 대상).
 *   - submit=false → `POST /api/drafts/{sourceDraftId}/cancellation-drafts`(생성=임시저장, `DRAFT_CANCELLATION_CREATE`)
 *   - submit=true  → `POST /api/drafts/{sourceDraftId}/cancellation-drafts/submission`(생성+상신, `DRAFT_CANCELLATION_CREATE_SUBMISSION`)
 * 두 엔드포인트는 동일 body/응답 계약을 공유한다(`201`, `{draftId}`). path는 취소 대상 원본
 * 기안서(sourceDraftId)다 — 생성되는 취소기안 자체가 아니다.
 */
export async function createCancellationDraft(
  sourceDraftId: number,
  payload: CancellationDraftPayload,
  submit: boolean,
): Promise<CancellationDraftResult> {
  const url = submit
    ? `/api/drafts/${sourceDraftId}/cancellation-drafts/submission`
    : `/api/drafts/${sourceDraftId}/cancellation-drafts`
  const { data } = await apiClient.post<CancellationDraftResult>(url, payload)
  return data
}
