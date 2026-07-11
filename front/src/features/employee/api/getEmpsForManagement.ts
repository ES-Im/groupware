import { apiClient } from '@/shared/api/client'
import type { EmpManagementListParams, EmpManagementPage } from '../model/empManagement'

/**
 * 관리용 사원 리스트 조회(`EMPS_FOR_MANAGEMENT`, api-endpoint.md 기능ID `EMPS_FOR_MANAGEMENT` →
 * `GET /api/employees`). 권한: HR 또는 DEPT_MANAGER(같은 부서) 또는 ADMIN — 서버가 최종 판단하며,
 * 이 함수는 호출부(useEmpForManagementQuery)의 enabled 가드로만 게이팅된다.
 *
 * deptId/status/keyword/page/size 전부 선택값(query-parameters.adoc)이라, 값이 없는 파라미터는
 * 쿼리스트링 자체에서 생략되도록 조건부로만 채운다(getDepartmentMembers와 동일 컨벤션).
 */
export async function getEmpsForManagement(
  params?: EmpManagementListParams,
): Promise<EmpManagementPage> {
  const query: Record<string, string | number> = {}
  if (params?.deptId != null) {
    query.deptId = params.deptId
  }
  if (params?.status) {
    query.status = params.status
  }
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<EmpManagementPage>('/api/employees', { params: query })
  return data
}
