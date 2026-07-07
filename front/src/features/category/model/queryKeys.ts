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
}
