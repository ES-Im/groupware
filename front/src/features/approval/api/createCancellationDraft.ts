import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

export interface CancellationDraftPayload {
  title: string
  content: string
  approvers?: ApproverParam[]
}

export interface CancellationDraftResult {
  draftId: number
}

export async function createCancellationDraft(
  sourceDraftId: number,
  payload: CancellationDraftPayload,
  submit: boolean,
): Promise<CancellationDraftResult> {
  const url = submit
    ? `/api/drafts/${sourceDraftId}/cancellation-drafts/submission`
    : `/api/drafts/${sourceDraftId}/cancellation-drafts`
  const { data } = await apiClient.post<CancellationDraftResult>(url, payload)
  return data
}
