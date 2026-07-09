import { apiClient } from '@/shared/api/client'

/**
 * 공람 읽음 처리(`DRAFT_CIRCULATION_READ`, F709 → `PATCH /api/drafts/{draftId}/circulations/me/read`,
 * minRole EMPLOYEE). http-request.adoc 실측: 요청 본문 없음(path param draftId). 성공 시
 * `204 No Content`. 공람 대상자 본인만 처리하며(서버 최종 판정), 이미 읽은 건은 재열람 처리가
 * 불가하다(도메인 에러 → 호출부 apiError 처리).
 */
export async function readCirculation(draftId: number): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/circulations/me/read`)
}
