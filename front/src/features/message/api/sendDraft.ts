import { apiClient } from '@/shared/api/client'

export async function sendDraft(messageId: number): Promise<void> {
  await apiClient.patch(`/api/messages/drafts/${messageId}/send`)
}
