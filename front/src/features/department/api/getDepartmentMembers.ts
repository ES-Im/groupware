import { apiClient } from '@/shared/api/client'
import type { DeptMembersPage } from '../model/deptMember'

/**
 * 특정 부서 멤버 조회(`DEPT_MEMBERS`, api-endpoint.md 기능ID `DEPT_MEMBERS` →
 * `GET /api/departments/{deptId}/members`).
 *
 * keyword/isEmpActive/page/size 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc).
 * 이번 태스크(T2.1-a, 데이터 계층)에는 목록/검색 UI가 없어 deptId만 받아 서버 기본값으로
 * 조회하며, 페이지네이션·검색 파라미터 연동은 T2.1-b(UI 계층) 몫이다.
 */
export async function getDepartmentMembers(deptId: number): Promise<DeptMembersPage> {
  const { data } = await apiClient.get<DeptMembersPage>(`/api/departments/${deptId}/members`)
  return data
}
