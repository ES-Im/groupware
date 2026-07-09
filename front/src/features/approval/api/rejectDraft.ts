import { apiClient } from '@/shared/api/client'

/**
 * 기안서 반려(`DRAFT_REJECT`, F706 → `PATCH /api/drafts/{draftId}/rejection`, minRole EMPLOYEE).
 *
 * request-fields.adoc 실측: body `{ reason: String }`(필수·공백 불가). 성공 시 `204 No Content`이며
 * 반려 즉시 REJECTED로 전이된다. reason 공백 불가 사전검증은 rejectionSchema(RHF+zod)가 담당하고,
 * 차례 아님·이미 처리 등 서버 위반은 도메인 에러로 내려온다(호출부에서 apiError 처리).
 */
export async function rejectDraft(draftId: number, reason: string): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/rejection`, { reason })
}
