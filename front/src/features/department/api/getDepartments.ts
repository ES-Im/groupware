import { apiClient } from '@/shared/api/client'
import { normalizeDeptLeader } from '../lib/normalizeDeptLeader'
import type { DeptInfoResponse, DeptLeader } from '../model/deptInfo'
import type { Page } from '../model/deptMember'
import type { DeptsPage } from '../model/deptSummary'

/** 화면이 소비하는 부서 목록 1건. deptLeader는 정규화를 거쳐 공석이면 null로 좁혀진 상태다. */
export interface DepartmentSummary {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeader | null
}

/** 화면이 소비하는 부서 목록 응답(Spring Data Page 표준 구조, docs/backend-contract/page.md). */
export type DepartmentsPage = Page<DepartmentSummary>

/**
 * 전체 부서 목록 조회(`DEPTS`, api-endpoint.md 기능ID `DEPTS` →
 * `GET /api/departments`, minRole EMPLOYEE).
 *
 * keyword/isActive/page/size 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc 실측).
 * isActive를 전달하지 않으면 모든 상태(활성/비활성)의 부서를 포함해 조회한다(query-parameters.adoc).
 * 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다.
 *
 * 응답 content[].deptLeader는 `DEPT_INFO`와 동일하게 부서장 공석 시 전 필드 null 객체
 * (`DeptLeaderWire`)로 내려오므로, `normalizeDeptLeader`(T6.1에서 신설)로 정규화해
 * 상위 컴포넌트가 "deptLeader === null"이라는 깔끔한 계약만 신뢰하도록 한다.
 */
export async function getDepartments(params?: {
  keyword?: string
  isActive?: boolean
  page?: number
  size?: number
}): Promise<DepartmentsPage> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.isActive != null) {
    query.isActive = params.isActive
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<DeptsPage>('/api/departments', { params: query })
  return {
    ...data,
    content: data.content.map((item) => ({
      ...item,
      deptLeader: normalizeDeptLeader(item.deptLeader),
    })),
  }
}
