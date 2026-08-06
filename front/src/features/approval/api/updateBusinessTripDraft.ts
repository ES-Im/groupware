import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

export interface BusinessTripDraftUpdatePayload {
  param?: {
    title?: string
    content?: string
    approvers?: ApproverParam[]
  }
  startAt?: string
  endAt?: string
  destination?: string
  purpose?: string
}

export async function updateBusinessTripDraft(
  draftId: number,
  payload: BusinessTripDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/business-trips/${draftId}`, payload)
}
