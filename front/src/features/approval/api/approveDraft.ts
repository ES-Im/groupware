import { apiClient } from '@/shared/api/client'

/**
 * 기안서 승인(`DRAFT_APPROVE`, F705 → `PATCH /api/drafts/{draftId}/approval`, minRole EMPLOYEE).
 *
 * http-request.adoc/request-body.adoc 실측: 요청 본문 없음(path param draftId만), 성공 시
 * `204 No Content`(response-body.adoc 부재 → http-response.adoc 실측). 남은 결재자가 있으면
 * IN_PROGRESS, 없으면 APPROVED로 서버가 전이한다. 승인 가능 여부(현재 내 차례)는 서버 최종 판정이며,
 * 차례 아님·이미 처리·결재선 밖은 도메인 에러로 내려온다(호출부 mutation이 apiError로 처리).
 */
export async function approveDraft(draftId: number): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/approval`)
}
