import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseEducationDetail } from './getFranchiseEducationDetail'

export function useFranchiseEducationDetailQuery(educationId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.education.detail(educationId as number),
    queryFn: () => getFranchiseEducationDetail(educationId as number),
    enabled: educationId != null,
  })
}
