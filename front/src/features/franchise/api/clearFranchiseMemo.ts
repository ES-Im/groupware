import { apiClient } from '@/shared/api/client'

/**
 * 가맹점 메모 삭제(`FRANCHISE_MEMO_CLEAR`, api-endpoint.md 기능ID `FRANCHISE_MEMO_CLEAR` →
 * `PATCH /api/franchises/{franchiseId}/clear-memo`, minRole FRANCHISE 또는 ADMIN).
 * 요청 본문 없음(http-request.adoc 실측 — DELETE가 아니라 PATCH 무본문이다, 임의 변경 금지).
 * 성공 시 `204 No Content`. 실패 시 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export async function clearFranchiseMemo(franchiseId: number): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/clear-memo`)
}
