import { apiClient } from '@/shared/api/client'

export interface FranchiseEducationUpdatePayload {
  educationDate?: string
  place?: string
  title?: string
  content?: string
  capacity?: number
}

export async function updateFranchiseEducation(
  educationId: number,
  payload: FranchiseEducationUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/franchise-educations/${educationId}`, payload)
}
