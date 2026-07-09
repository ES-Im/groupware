import { apiClient } from '@/shared/api/client'

/**
 * 공람자 제거(`DRAFT_CIRCULATION_REMOVE`, F708 → `DELETE /api/drafts/{draftId}/circulations/{empId}`,
 * minRole EMPLOYEE). http-request.adoc 실측: 요청 본문 없음(path param draftId·empId). 성공 시
 * `204 No Content`. 기안자 본인만 제거할 수 있다(서버 최종 판정 — 기안자 아님은 도메인 에러).
 */
export async function removeCirculation(draftId: number, empId: number): Promise<void> {
  await apiClient.delete(`/api/drafts/${draftId}/circulations/${empId}`)
}
