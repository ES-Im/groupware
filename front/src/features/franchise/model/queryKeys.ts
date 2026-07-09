/**
 * franchise 도메인 queryKey 팩토리(ROADMAP(SALES) T1.1 / §참조 계약 매핑).
 * department 도메인(departmentKeys)과 동형 구조 — all을 배열 리터럴로 고정해
 * invalidateQueries(franchiseKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * list의 params(keyword/status/managerId/page/size)는 검색·필터·페이징 상태가 바뀔 때마다
 * 별도 캐시 엔트리로 구분되도록 queryKey에 그대로 포함한다 — FranchisePicker(T1.2)의 담당
 * 기본뷰(managerId)↔전체 검색(keyword) 모드 전환도 이 축으로 캐시된다.
 */
export const franchiseKeys = {
  all: ['franchise'] as const,
  list: (params?: {
    keyword?: string
    status?: string
    managerId?: number
    page?: number
    size?: number
  }) => [...franchiseKeys.all, 'list', params] as const,
}
