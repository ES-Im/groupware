import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmpBelongings } from './getEmpBelongings'

export function useEmpBelongingsQuery(empId: number | undefined) {
  return useQuery({
    queryKey: employeeKeys.belongings(empId),
    queryFn: () => getEmpBelongings(empId as number),
    enabled: empId != null,
  })
}
