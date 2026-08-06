import { apiClient } from '@/shared/api/client'

export async function deleteEducationFile(educationId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/educations/${educationId}/files/${fileId}`)
}
