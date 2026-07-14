import { apiClient } from '@/shared/api/client'

/**
 * 카테고리명 변경(`CATEGORY_UPDATE_NAME`, api-endpoint.md 기능ID `CATEGORY_UPDATE_NAME` →
 * `PATCH /api/categories/{categoryId}/name`, minRole ADMIN). categoryName은 30자 이하·공백
 * 불가(request-fields.adoc 실측). 성공 시 `204 No Content`. 실패는 그대로 던져 호출부가
 * handleApiError/submitWithErrorMapping으로 위임하도록 둔다.
 */
export async function updateCategoryName(categoryId: number, categoryName: string): Promise<void> {
  await apiClient.patch(`/api/categories/${categoryId}/name`, { categoryName })
}
