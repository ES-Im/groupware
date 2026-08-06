import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationApplicantsPage } from '../model/franchise'

export async function getFranchiseEducationApplicants(
  educationId: number,
  params?: { page?: number; size?: number },
): Promise<FranchiseEducationApplicantsPage> {
  const query: Record<string, number> = {}
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<FranchiseEducationApplicantsPage>(
    `/api/franchise-educations/${educationId}/applicants`,
    { params: query },
  )
  return data
}
