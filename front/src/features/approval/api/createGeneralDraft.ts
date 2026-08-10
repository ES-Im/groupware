import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import type { ApproverParam } from '../model/approverParam'

export interface GeneralDraftPayload {
  title: string
  content: string
  approvers?: ApproverParam[]
}

export async function createGeneralDraft(
  payload: GeneralDraftPayload,
  submit: boolean,
): Promise<RegisterDomainIdResponse> {
  const url = submit ? '/api/drafts/generals/submission' : '/api/drafts/generals'
  const { data } = await apiClient.post<RegisterDomainIdResponse>(url, payload)
  return data
}
