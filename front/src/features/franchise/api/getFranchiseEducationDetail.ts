import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationDetail } from '../model/franchise'

export async function getFranchiseEducationDetail(
  educationId: number,
): Promise<FranchiseEducationDetail> {
  const { data } = await apiClient.get<FranchiseEducationDetail>(
    `/api/franchise-educations/${educationId}`,
  )
  return data
}
