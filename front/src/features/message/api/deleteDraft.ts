import { apiClient } from '@/shared/api/client'

export async function deleteDraft(messageId: number): Promise<void> {
  await apiClient.delete(`/api/messages/drafts/${messageId}`)
}
