import { apiClient } from '@/shared/api/client'

export async function activateFranchiseEducation(educationId: number): Promise<void> {
  await apiClient.post(`/api/franchise-educations/${educationId}/activation`)
}

export async function deactivateFranchiseEducation(educationId: number): Promise<void> {
  await apiClient.post(`/api/franchise-educations/${educationId}/deactivation`)
}
