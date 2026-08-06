import { useMeQuery } from '@/features/employee/api/useMeQuery'

export function usePrimaryDeptId(): number | undefined {
  const { data } = useMeQuery()
  const primaryDept = data?.currentDepts.find((dept) => dept.isPrimary)
  return primaryDept?.deptId
}
