import { apiClient } from '@/shared/api/client'

/**
 * 사원 활성화(`HR_ACTIVATE_EMP`, api-endpoint.md `PATCH /api/employees/{empId}/status/activation`,
 * HR 또는 ADMIN). path empId만 사용하고 요청 본문은 없다(EmpManagementApi.java 실측).
 * 성공 시 `204 No Content` — 호출부(useActivateEmpMutation)가 캐시를 invalidate한다.
 */
export async function activateEmp(empId: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/status/activation`)
}
