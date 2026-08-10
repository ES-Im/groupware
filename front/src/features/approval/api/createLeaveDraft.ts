import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import type { ApproverParam } from '../model/approverParam'

export interface LeaveDraftPayload {
  param: {
    title: string
    content: string
    approvers?: ApproverParam[]
  }
  startAt: string
  endAt: string
  leaveType: string
}

export async function createLeaveDraft(
  payload: LeaveDraftPayload,
  submit: boolean,
): Promise<RegisterDomainIdResponse> {
  const url = submit ? '/api/drafts/leaves/submission' : '/api/drafts/leaves'
  const { data } = await apiClient.post<RegisterDomainIdResponse>(url, payload)
  return data
}
