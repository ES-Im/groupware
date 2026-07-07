import type { DeptInfoResponse, DeptLeaderWire } from './deptInfo'
import type { Page } from './deptMember'

/**
 * 전체 부서 목록 조회(`DEPTS`, GET /api/departments) 응답 항목의 wire 타입.
 * 필드는 back/build/generated-snippets/DEPTS/response-fields.adoc 실측 기준(추측 금지).
 * deptLeader는 `DEPT_INFO`와 동일한 wire 계약을 따른다: 부서장 공석 시 JSON null이 아니라
 * 전 필드가 null인 객체로 내려온다(3.department-management-prd.md "부서장 공석 wire 계약" 절).
 * 화면 소비 시에는 정규화된 `DeptLeader | null`로 좁혀야 하며, 그 변환은 `getDepartments`
 * (api/getDepartments.ts)가 `normalizeDeptLeader`로 수행한다.
 */
export interface DeptSummary {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeaderWire
}

/** `DEPTS` 응답 전체(Spring Data Page 표준 구조, docs/backend-contract/page.md). */
export type DeptsPage = Page<DeptSummary>
