import { apiClient } from '@/shared/api/client'

export async function deleteFranchiseEducation(educationId: number): Promise<void> {
  await apiClient.delete(`/api/franchise-educations/${educationId}`)
}
