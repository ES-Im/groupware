import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmployee } from './getEmployee'

export function useEmployeeQuery(empId: number | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(empId),
    queryFn: () => getEmployee(empId as number),
    enabled: empId != null && !Number.isNaN(empId),
  })
}
