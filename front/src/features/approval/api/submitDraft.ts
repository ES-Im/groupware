import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

export async function submitDraft(draftId: number, approvers?: ApproverParam[]): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/submission`, approvers ?? undefined)
}
