import { useQueries } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartmentMembers } from './getDepartmentMembers'

export function useDepartmentMemberCountsQuery(deptIds: number[]) {
  const results = useQueries({
    queries: deptIds.map((deptId) => ({
      queryKey: departmentKeys.members(deptId, { isEmpActive: true, size: 1 }),
      queryFn: () => getDepartmentMembers(deptId, { isEmpActive: true, size: 1 }),
    })),
  })

  const counts: Record<number, number> = {}
  results.forEach((result, index) => {
    if (result.data) {
      counts[deptIds[index]] = result.data.totalElements
    }
  })

  return {
    counts,
    isLoading: results.some((result) => result.isLoading),
  }
}
