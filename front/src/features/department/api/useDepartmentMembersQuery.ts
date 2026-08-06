import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartmentMembers } from './getDepartmentMembers'

export function useDepartmentMembersQuery(
  deptId: number | undefined,
  params?: { keyword?: string; page?: number; size?: number },
) {
  return useQuery({
    queryKey: departmentKeys.members(deptId, params),
    queryFn: () => getDepartmentMembers(deptId as number, params),
    enabled: deptId != null,
    placeholderData: keepPreviousData,
  })
}
