/**
 * 노출 카테고리 목록 조회(`CATEGORY_LIST`, GET /api/categories) 응답 타입.
 * 필드는 back/build/generated-snippets/CATEGORY_LIST/response-fields.adoc 실측 기준(추측 금지).
 * 응답은 페이징 없는 순수 배열이다(Page 래퍼 아님).
 */
export interface CategoryItem {
  categoryId: number
  categoryName: string
  isVisible: boolean
}
