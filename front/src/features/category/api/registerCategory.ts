import { apiClient } from '@/shared/api/client'

/**
 * 카테고리 등록(`CATEGORY_REGISTER`, api-endpoint.md 기능ID `CATEGORY_REGISTER` →
 * `POST /api/categories`, minRole ADMIN). categoryName은 30자 이하·공백 불가
 * (request-fields.adoc 실측). 성공 시 `201 Created` + Empty body(response-body.adoc 실측 —
 * 생성된 categoryId를 반환하지 않는다). 실패는 그대로 던져 호출부가 handleApiError/
 * submitWithErrorMapping으로 위임하도록 둔다.
 */
export async function registerCategory(categoryName: string): Promise<void> {
  await apiClient.post('/api/categories', { categoryName })
}
