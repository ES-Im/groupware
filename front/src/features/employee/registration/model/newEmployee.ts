/**
 * 가입 대기(신규) 사원 목록 조회(`NEW_EMP_LIST`, GET /api/employees/new) 응답 타입.
 * 필드는 back/build/generated-snippets/NEW_EMP_LIST/response-fields.adoc 실측 기준(추측 금지).
 * name 필드는 관리용 목록(EmpManagementRecord.empName, ../../model/empManagement.ts)과
 * 필드명이 다르므로 혼동하지 않는다 — 그대로 name으로 선언한다.
 */

/**
 * 가입 대기 사원 목록 1건.
 * extensionNo: response-fields.adoc에 nullable 명시가 없고 http-response.adoc 예시는 빈 문자열("")이다.
 * null 케이스는 미확인 상태이므로 실제 응답 재확인 전까지 string으로 둔다(발명 금지).
 */
export interface NewEmpRecord {
  empId: number
  empNo: string
  name: string
  loginId: string
  email: string
  extensionNo: string
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외) —
 * empManagement.ts의 Page<T>와 동일 컨벤션이나, 도메인이 달라 별도로 둔다.
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

export type NewEmployeesPage = Page<NewEmpRecord>
