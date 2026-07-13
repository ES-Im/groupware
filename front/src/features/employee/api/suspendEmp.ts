import { apiClient } from '@/shared/api/client'

/**
 * 사원 정직 처리(`HR_SUSPEND_EMP`, api-endpoint.md `PATCH /api/employees/{empId}/status/suspension`,
 * HR 또는 ADMIN). path empId만 사용하고 요청 본문은 없다(EmpManagementApi.java 실측).
 * 성공 시 `204 No Content` — 호출부(useSuspendEmpMutation)가 캐시를 invalidate한다.
 */
export async function suspendEmp(empId: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/status/suspension`)
}
