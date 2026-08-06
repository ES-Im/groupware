import { useQuery } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartmentInfo } from './getDepartmentInfo'

export function useDepartmentInfoQuery(deptId: number | undefined) {
  return useQuery({
    queryKey: departmentKeys.detail(deptId),
    queryFn: () => getDepartmentInfo(deptId as number),
    enabled: deptId != null,
  })
}
