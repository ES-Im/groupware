import { apiClient } from '@/shared/api/client'

/**
 * 기안서 상신 철회(`DRAFT_SUBMISSION_WITHDRAWAL`, F703 →
 * `PATCH /api/drafts/{draftId}/submission-withdrawal`, 기안자 본인).
 *
 * 요청 body 없음(request-fields.adoc 없음). 상신 기안(WAITING·IN_PROGRESS)을 진행 전 상태로
 * 되돌린다. 성공 시 `204 No Content` — 호출부(useDraftSubmissionWithdrawalMutation)가
 * approvalKeys.all을 invalidate해 상세(상태 배지)와 상신함/임시저장함 목록을 최신화한다.
 */
export async function withdrawDraftSubmission(draftId: number): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/submission-withdrawal`)
}
