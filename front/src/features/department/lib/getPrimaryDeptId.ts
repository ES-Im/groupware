import type { CurrentDept } from '@/features/employee/model/me'

/**
 * 본인 소속 주 부서 deptId 도출(ROADMAP T2.1-a, 사용자 확정 결정).
 * currentDepts 중 isPrimary===true 항목을 우선 선택하고, 없으면 첫 번째 항목으로 폴백한다.
 * 부서 선택 UI는 이번 스코프에 없다 — 결과가 없으면(currentDepts가 빈 배열) undefined를 반환한다.
 */
export function getPrimaryDeptId(currentDepts: CurrentDept[]): number | undefined {
  const primary = currentDepts.find((dept) => dept.isPrimary)
  return (primary ?? currentDepts[0])?.deptId
}
