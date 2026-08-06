import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseDetail } from './getFranchiseDetail'

export function useFranchiseDetailQuery(franchiseId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.detail(franchiseId as number),
    queryFn: () => getFranchiseDetail(franchiseId as number),
    enabled: franchiseId != null,
  })
}
