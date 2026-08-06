import { apiClient } from '@/shared/api/client'

export async function deleteDraftFile(draftId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/drafts/${draftId}/files/${fileId}`)
}
