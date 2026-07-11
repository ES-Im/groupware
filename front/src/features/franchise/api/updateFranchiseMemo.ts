import { apiClient } from '@/shared/api/client'

/**
 * 가맹점 메모 수정(`FRANCHISE_MEMO_UPDATE`, api-endpoint.md 기능ID `FRANCHISE_MEMO_UPDATE` →
 * `PATCH /api/franchises/{franchiseId}/memo`, minRole FRANCHISE 또는 ADMIN).
 * body는 `{memo}` 하나(필수, 공백 불가 — request-fields.adoc 실측). 성공 시 `204 No Content`.
 * 실패 시 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export async function updateFranchiseMemo(franchiseId: number, memo: string): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/memo`, { memo })
}
