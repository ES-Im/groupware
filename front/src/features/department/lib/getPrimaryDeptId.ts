import type { CurrentDept } from '@/features/employee/model/me'

export function getPrimaryDeptId(currentDepts: CurrentDept[]): number | undefined {
  const primary = currentDepts.find((dept) => dept.isPrimary)
  return (primary ?? currentDepts[0])?.deptId
}
