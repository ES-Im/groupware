import { apiClient } from '@/shared/api/client'

export async function uploadDraftFile(draftId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/drafts/${draftId}/files`, formData)
}
