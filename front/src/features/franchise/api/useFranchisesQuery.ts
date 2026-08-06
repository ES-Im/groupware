import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchises } from './getFranchises'

export function useFranchisesQuery(
  params?: {
    keyword?: string
    status?: string
    managerId?: number
    page?: number
    size?: number
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: franchiseKeys.list(params),
    queryFn: () => getFranchises(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  })
}
