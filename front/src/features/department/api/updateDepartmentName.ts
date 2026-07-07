import { apiClient } from '@/shared/api/client'

/**
 * 부서명 변경(`DEPT_UPDATE_NAME`, api-endpoint.md `PATCH /api/departments/{deptId}/name?newName={value}`, ADMIN 전용).
 * newName은 필수 query 파라미터다(query-parameters.adoc 실측). path deptId + query만 사용하고
 * 별도 요청 본문은 없다. 성공 시 `204 No Content`(응답 본문 없음) — 호출부
 * (useUpdateDepartmentNameMutation)가 departmentKeys.detail(deptId)를 invalidate해 상세
 * 화면을 재조회한다.
 */
export async function updateDepartmentName(deptId: number, newName: string): Promise<void> {
  await apiClient.patch(`/api/departments/${deptId}/name`, null, { params: { newName } })
}
