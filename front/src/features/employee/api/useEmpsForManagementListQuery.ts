import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmpsForManagement } from './getEmpsForManagement'
import type { EmpManagementListParams } from '../model/empManagement'

export function useEmpsForManagementListQuery(params: EmpManagementListParams) {
  return useQuery({
    queryKey: employeeKeys.empsForManagement(params),
    queryFn: () => getEmpsForManagement(params),
  })
}
