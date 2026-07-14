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

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
 * board/franchise 도메인의 `Page<T>`와 동형이며, 도메인마다 독립 정의하는 기존 컨벤션을 그대로
 * 따른다(공유 제네릭 승격은 이번 태스크 범위 밖).
 */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * 카테고리 관리 목록 조회(`CATEGORY_MANAGEMENT`, GET /api/categories/management, minRole ADMIN)
 * 응답 타입. content 항목은 CategoryItem과 완전히 동일한 shape이다(categoryId/categoryName/
 * isVisible, response-fields.adoc 실측 — CATEGORY_LIST와 달리 이쪽은 숨김 카테고리도 포함한다).
 */
export type CategoryManagementPage = Page<CategoryItem>
