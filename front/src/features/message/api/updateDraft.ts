import { apiClient } from '@/shared/api/client'

export interface UpdateDraftPayload {
  title?: string
  content?: string
}

export async function updateDraft(messageId: number, payload: UpdateDraftPayload): Promise<void> {
  await apiClient.patch(`/api/messages/drafts/${messageId}`, payload)
}
