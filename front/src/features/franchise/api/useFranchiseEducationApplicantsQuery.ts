import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseEducationApplicants } from './getFranchiseEducationApplicants'

export function useFranchiseEducationApplicantsQuery(
  educationId: number | undefined,
  params?: { page?: number; size?: number },
) {
  return useQuery({
    queryKey: franchiseKeys.education.applicants(educationId as number, params),
    queryFn: () => getFranchiseEducationApplicants(educationId as number, params),
    enabled: educationId != null,
    placeholderData: keepPreviousData,
  })
}
