import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

export interface LeaveDraftUpdatePayload {
  param?: {
    title?: string
    content?: string
    approvers?: ApproverParam[]
  }
  startAt?: string
  endAt?: string
  leaveType?: string
}

export async function updateLeaveDraft(
  draftId: number,
  payload: LeaveDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/leaves/${draftId}`, payload)
}
