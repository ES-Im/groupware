import { apiClient } from '@/shared/api/client'
import type { DeptMembersPage } from '../model/deptMember'

/**
 * 특정 부서 멤버 조회(`DEPT_MEMBERS`, api-endpoint.md 기능ID `DEPT_MEMBERS` →
 * `GET /api/departments/{deptId}/members`).
 *
 * keyword/isEmpActive/page/size 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc).
 * 이번 스코프(부서 상세 화면)에서는 keyword/page/size만 연동하고 isEmpActive는 사용하지
 * 않는다. 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다
 * (axios는 undefined 값 키를 URL에 포함하지 않지만, keyword의 빈 문자열은 명시적으로 걸러낸다).
 */
export async function getDepartmentMembers(
  deptId: number,
  params?: { keyword?: string; page?: number; size?: number },
): Promise<DeptMembersPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<DeptMembersPage>(`/api/departments/${deptId}/members`, {
    params: query,
  })
  return data
}
