import { apiClient } from '@/shared/api/client'

export async function withdrawDraftSubmission(draftId: number): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/submission-withdrawal`)
}
