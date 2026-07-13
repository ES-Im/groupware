/**
 * 특정 부서 멤버 조회(`DEPT_MEMBERS`, GET /api/departments/{deptId}/members) 응답 타입.
 * 필드는 back/build/generated-snippets/DEPT_MEMBERS/response-fields.adoc 실측 기준(추측 금지).
 */

/** 부서 멤버 1건. */
export interface DeptMemberResponse {
  empId: number
  empNo: string
  empName: string
  extensionNo: string | null
  email: string
  position: string
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
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

export type DeptMembersPage = Page<DeptMemberResponse>

/**
 * 전사 사원 이름 검색(useEmployeeNameSearchQuery) 결과 1건. 부서별 DEPT_MEMBERS 팬아웃 조회
 * 결과에, 조회 시점에 이미 알고 있는 deptId/deptName을 함께 얹은 화면 전용 타입이다
 * (EMPLOYEE 권한으로 쓸 수 있는 전사 사원 검색 API가 없어 헤더 사원 검색 오버레이 전용으로 도입).
 */
export interface DeptMemberSearchResult extends DeptMemberResponse {
  deptId: number
  deptName: string
}
