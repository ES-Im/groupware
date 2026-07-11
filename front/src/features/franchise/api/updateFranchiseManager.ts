import { apiClient } from '@/shared/api/client'

/**
 * 가맹점 담당자 변경(`FRANCHISE_MANAGER_UPDATE`, api-endpoint.md 기능ID `FRANCHISE_MANAGER_UPDATE` →
 * `PATCH /api/franchises/{franchiseId}/managers?newManagerId={value}`, minRole FRANCHISE 또는 ADMIN).
 * newManagerId는 필수 쿼리 파라미터(query-parameters.adoc 실측). 성공 시 `204 No Content`.
 * 새 담당자는 활성·FRANCHISE 권한 사원이어야 하지만 이는 서버 판정이다 — 프론트는 선택된 empId를
 * 그대로 전송하고(사전 필터링 발명 금지), 위반 시 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export async function updateFranchiseManager(
  franchiseId: number,
  newManagerId: number,
): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/managers`, null, {
    params: { newManagerId },
  })
}
