import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationCreateRequest, FranchiseEducationCreateResponse } from '../model/franchise'

export async function createFranchiseEducation(
  payload: FranchiseEducationCreateRequest,
): Promise<FranchiseEducationCreateResponse> {
  const { data } = await apiClient.post<FranchiseEducationCreateResponse>('/api/franchise-educations', payload)
  return data
}
