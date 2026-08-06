import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

export interface GeneralDraftUpdatePayload {
  title?: string
  content?: string
  approvers?: ApproverParam[]
}

export async function updateGeneralDraft(
  draftId: number,
  payload: GeneralDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/generals/${draftId}`, payload)
}
