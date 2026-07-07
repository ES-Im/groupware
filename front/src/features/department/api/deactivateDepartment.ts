import { apiClient } from '@/shared/api/client'

/**
 * 부서 비활성화(`DEPT_DEACTIVATE`, api-endpoint.md `PATCH /api/departments/{deptId}/deactivation`, ADMIN 전용).
 * path deptId만 사용하고 요청 본문은 없다(path-parameters.adoc 실측 — query/body 파라미터 없음).
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부(useDeactivateDepartmentMutation)가
 * departmentKeys.detail(deptId)를 invalidate해 상세 화면을 재조회한다.
 */
export async function deactivateDepartment(deptId: number): Promise<void> {
  await apiClient.patch(`/api/departments/${deptId}/deactivation`)
}
