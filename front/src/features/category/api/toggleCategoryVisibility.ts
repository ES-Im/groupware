import { apiClient } from '@/shared/api/client'

/**
 * 카테고리 노출(`CATEGORY_ACTIVATE`, api-endpoint.md 기능ID `CATEGORY_ACTIVATE` →
 * `PATCH /api/categories/{categoryId}/visibility/activation`, minRole ADMIN). 요청 본문 없음,
 * 성공 시 `204 No Content`(http-request/http-response.adoc 실측).
 */
export async function activateCategory(categoryId: number): Promise<void> {
  await apiClient.patch(`/api/categories/${categoryId}/visibility/activation`)
}

/**
 * 카테고리 숨김(`CATEGORY_DEACTIVATE`, api-endpoint.md 기능ID `CATEGORY_DEACTIVATE` →
 * `PATCH /api/categories/{categoryId}/visibility/deactivation`, minRole ADMIN). 요청 본문 없음,
 * 성공 시 `204 No Content`.
 *
 * ⚠️ 하드 삭제 엔드포인트는 계약에 없다(api-endpoint.md 150~155행 6종 전부 확인 — DELETE 없음).
 * UI의 "삭제"는 이 숨김(비활성화)으로 매핑한다(팀리드 브리프 — 계약에 없는 동작을 발명하지 않음).
 */
export async function deactivateCategory(categoryId: number): Promise<void> {
  await apiClient.patch(`/api/categories/${categoryId}/visibility/deactivation`)
}
