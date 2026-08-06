import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmpsForManagement } from './getEmpsForManagement'

const MANAGEMENT_LIST_SIZE = 100

export function useEmpForManagementQuery(
  deptId: number | undefined,
  empId: number | undefined,
  enabled: boolean,
) {
  const params = { deptId, size: MANAGEMENT_LIST_SIZE }
  return useQuery({
    queryKey: employeeKeys.empsForManagement(params),
    queryFn: () => getEmpsForManagement(params),
    enabled: enabled && deptId != null && empId != null,
    select: (data) => data.content.find((record) => record.empId === empId),
  })
}
