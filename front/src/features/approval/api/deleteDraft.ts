import { apiClient } from '@/shared/api/client'

export async function deleteDraft(draftId: number): Promise<void> {
  await apiClient.delete(`/api/drafts/${draftId}`)
}
