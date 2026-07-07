import { apiClient } from '@/shared/api/client'

/**
 * 부서장 지정(`DEPT_APPOINT_LEADER`, api-endpoint.md
 * `PATCH /api/departments/{deptId}/leader/appointment?leaderEmpId={value}&appointedAt={value}`, ADMIN 전용).
 * leaderEmpId·appointedAt 모두 필수 query 파라미터다(query-parameters.adoc 실측).
 * appointedAt은 `yyyy-MM-dd` 포맷 문자열이어야 한다(스니펫 실측, CLAUDE.md 전역 dayjs 규약) —
 * 이 함수는 포맷을 강제하지 않으므로 호출부(UI, T9.2)가 dayjs로 포맷을 맞춰 전달해야 한다.
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부(useAppointDepartmentLeaderMutation)가
 * departmentKeys.detail(deptId)를 invalidate해 상세 화면을 재조회한다.
 */
export async function appointDepartmentLeader(
  deptId: number,
  params: { leaderEmpId: number; appointedAt: string },
): Promise<void> {
  await apiClient.patch(`/api/departments/${deptId}/leader/appointment`, null, { params })
}
