import { apiClient } from '@/shared/api/client'

export async function approveDraft(draftId: number): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/approval`)
}
