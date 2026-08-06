import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

export interface GeneralDraftPayload {
  title: string
  content: string
  approvers?: ApproverParam[]
}

export interface GeneralDraftResult {
  draftId: number
}

export async function createGeneralDraft(
  payload: GeneralDraftPayload,
  submit: boolean,
): Promise<GeneralDraftResult> {
  const url = submit ? '/api/drafts/generals/submission' : '/api/drafts/generals'
  const { data } = await apiClient.post<GeneralDraftResult>(url, payload)
  return data
}
