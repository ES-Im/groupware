/**
 * 가맹점 목록 조회(`FRANCHISE_LIST`) 응답 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_LIST/response-fields.adoc 실측 기준(추측 금지).
 */

/**
 * 가맹점 목록 1건.
 * `BusinessStatus`는 백엔드 응답 JSON 키 그대로(대문자 시작)다 — 다른 필드와 달리 camelCase가
 * 아니므로 임의로 고치지 않는다(response-body.adoc 실측: `"BusinessStatus":"정상 영업 중"`).
 */
export interface Franchise {
  id: number
  name: string
  address: string
  ownerName: string
  BusinessStatus: string
  managerEmpId: number
  managerEmpName: string
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

export type FranchisesPage = Page<Franchise>
