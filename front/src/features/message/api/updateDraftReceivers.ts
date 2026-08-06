import { apiClient } from '@/shared/api/client'

export async function updateDraftReceivers(
  messageId: number,
  receiverIds: number[],
): Promise<void> {
  await apiClient.patch(`/api/messages/drafts/${messageId}/receivers`, { receiverIds })
}
