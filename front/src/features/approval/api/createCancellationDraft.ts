import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import type { ApproverParam } from '../model/approverParam'

export interface CancellationDraftPayload {
  title: string
  content: string
  approvers?: ApproverParam[]
}

export async function createCancellationDraft(
  sourceDraftId: number,
  payload: CancellationDraftPayload,
  submit: boolean,
): Promise<RegisterDomainIdResponse> {
  const url = submit
    ? `/api/drafts/${sourceDraftId}/cancellation-drafts/submission`
    : `/api/drafts/${sourceDraftId}/cancellation-drafts`
  const { data } = await apiClient.post<RegisterDomainIdResponse>(url, payload)
  return data
}
