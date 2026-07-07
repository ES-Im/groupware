import { apiClient } from '@/shared/api/client'

/**
 * 상위 부서 변경(`DEPT_UPDATE_PARENT`, api-endpoint.md
 * `PATCH /api/departments/{deptId}/parent?parentDeptId={value}`, ADMIN 전용).
 * parentDeptId는 선택 쿼리 파라미터다(query-parameters.adoc 실측: 필수여부 false, 미전달 시
 * 서버가 최상위 부서로 이동 처리). 값이 없으면 쿼리스트링 자체에서 생략되도록 params 객체에
 * 조건부로만 채운다(getDepartments.ts와 동일 패턴). 순환참조 등 심화 검증은 서버 책임이며
 * 프론트에서 재구현하지 않는다.
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부(useUpdateDepartmentParentMutation)가
 * departmentKeys.all을 invalidate해 재조회한다.
 */
export async function updateDepartmentParent(params: {
  deptId: number
  parentDeptId?: number
}): Promise<void> {
  const { deptId, parentDeptId } = params
  const query: Record<string, number> = {}
  if (parentDeptId != null) {
    query.parentDeptId = parentDeptId
  }
  await apiClient.patch(`/api/departments/${deptId}/parent`, null, { params: query })
}
