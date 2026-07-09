import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 기안서 상신(`DRAFT_SUBMIT`, F702 → `PATCH /api/drafts/{draftId}/submission`, 기안자 본인).
 *
 * 요청 body는 **최상위가 배열**이다(request-body.adoc 실측: `[{approverId,role,order}]`, 전부
 * optional). MVP는 기존 결재선으로 상신하므로 body를 생략한다(approvers 미전달 → 요청 본문 없음).
 * 결재선 재지정이 필요할 때만 approvers 배열을 넘긴다(EmployeePicker 재사용 옵션 — 이번 MVP 배선
 * 범위 밖). 성공 시 `204 No Content` — 호출부(useDraftSubmitMutation)가 approvalKeys.all을
 * invalidate해 상세(상태 배지)와 상신함/임시저장함 목록이 최신화되도록 한다.
 */
export async function submitDraft(draftId: number, approvers?: ApproverParam[]): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/submission`, approvers ?? undefined)
}
