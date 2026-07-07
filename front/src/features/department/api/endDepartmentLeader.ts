import { apiClient } from '@/shared/api/client'

/**
 * 현재 부서장 종료(`DEPT_END_LEADER`, api-endpoint.md
 * `PATCH /api/departments/{deptId}/leader/end?endAt={value}`, ADMIN 전용).
 * endAt은 필수 쿼리 파라미터이며 포맷은 `yyyy-MM-dd`다(query-parameters.adoc 실측, 전역 dayjs 규약).
 * 성공 시 `204 No Content`(응답 본문 없음) — 종료 후 공석 정규화(normalizeDeptLeader, T6.1)는
 * 호출부(useEndDepartmentLeaderMutation)가 departmentKeys.all을 invalidate해 재조회할 때
 * 기존 로직이 자동 적용되므로 이 함수에서 별도 처리하지 않는다.
 */
export async function endDepartmentLeader(params: {
  deptId: number
  endAt: string
}): Promise<void> {
  const { deptId, endAt } = params
  await apiClient.patch(`/api/departments/${deptId}/leader/end`, null, {
    params: { endAt },
  })
}
