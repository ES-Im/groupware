import { apiClient } from '@/shared/api/client'

export async function uploadEducationFile(educationId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/educations/${educationId}/files`, formData)
}
