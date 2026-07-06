/**
 * 특정 부서 멤버 조회(`DEPT_MEMBERS`, GET /api/departments/{deptId}/members) 응답 타입.
 * 필드는 back/build/generated-snippets/DEPT_MEMBERS/response-fields.adoc 실측 기준(추측 금지).
 */

/** 부서 멤버 1건. */
export interface DeptMemberResponse {
  empId: number
  empNo: string
  empName: string
  extensionNo: string
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
