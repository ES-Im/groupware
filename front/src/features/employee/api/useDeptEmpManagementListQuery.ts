import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmpsForManagement } from './getEmpsForManagement'

const MANAGEMENT_LIST_SIZE = 100

export function useDeptEmpManagementListQuery(deptId: number | undefined, enabled: boolean) {
  const params = { deptId, size: MANAGEMENT_LIST_SIZE }
  return useQuery({
    queryKey: employeeKeys.empsForManagement(params),
    queryFn: () => getEmpsForManagement(params),
    enabled: enabled && deptId != null,
  })
}
