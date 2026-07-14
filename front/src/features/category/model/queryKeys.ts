/**
 * category 도메인 queryKey 팩토리(ROADMAP T10.2 / §기술 스택).
 * departmentKeys(@/features/department/model/queryKeys)와 동형 구조 — all을 배열 리터럴로
 * 고정해 invalidateQueries(categoryKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * CATEGORY_LIST는 path/query 파라미터가 전혀 없는 단순 목록 조회(Empty request)라
 * list()는 인자를 받지 않는다.
 */
export const categoryKeys = {
  all: ['category'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  /**
   * 카테고리 관리 목록(CATEGORY_MANAGEMENT, ADMIN 전용). params(keyword/isVisible/page/size)는
   * franchiseKeys.list와 동형으로 queryKey에 그대로 포함해 검색·필터·페이징 상태별로 캐시
   * 엔트리를 구분한다.
   */
  management: (params?: {
    keyword?: string
    isVisible?: boolean
    page?: number
    size?: number
  }) => [...categoryKeys.all, 'management', params] as const,
}
