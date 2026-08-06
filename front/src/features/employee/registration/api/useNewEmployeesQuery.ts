import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../../model/queryKeys'
import { getNewEmployees } from './getNewEmployees'

export function useNewEmployeesQuery(params?: { keyword?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: employeeKeys.newEmployees(params),
    queryFn: () => getNewEmployees(params),
    placeholderData: keepPreviousData,
  })
}
