import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import type { ApproverParam } from '../model/approverParam'

export interface SalesDraftPayload {
  param: {
    title: string
    content: string
    approvers?: ApproverParam[]
  }
  franchiseId: number
  reportMonth: string
  salesAmount: number
}

export async function createSalesDraft(
  payload: SalesDraftPayload,
  submit: boolean,
): Promise<RegisterDomainIdResponse> {
  const url = submit ? '/api/drafts/sales/submission' : '/api/drafts/sales'
  const { data } = await apiClient.post<RegisterDomainIdResponse>(url, payload)
  return data
}
