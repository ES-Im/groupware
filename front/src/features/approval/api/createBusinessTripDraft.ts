import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import type { ApproverParam } from '../model/approverParam'

export interface BusinessTripDraftPayload {
  param: {
    title: string
    content: string
    approvers?: ApproverParam[]
  }
  startAt: string
  endAt: string
  destination: string
  purpose: string
  participantIds?: number[]
}

export async function createBusinessTripDraft(
  payload: BusinessTripDraftPayload,
  submit: boolean,
): Promise<RegisterDomainIdResponse> {
  const url = submit ? '/api/drafts/business-trips/submission' : '/api/drafts/business-trips'
  const { data } = await apiClient.post<RegisterDomainIdResponse>(url, payload)
  return data
}
