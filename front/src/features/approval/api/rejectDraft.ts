import { apiClient } from '@/shared/api/client'

export async function rejectDraft(draftId: number, reason: string): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/rejection`, { reason })
}
