import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getMe } from './getMe'

export function useMeQuery() {
  return useQuery({
    queryKey: employeeKeys.me(),
    queryFn: getMe,
  })
}
