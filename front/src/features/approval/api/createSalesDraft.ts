import { apiClient } from '@/shared/api/client'
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

export interface SalesDraftResult {
  draftId: number
}

export async function createSalesDraft(
  payload: SalesDraftPayload,
  submit: boolean,
): Promise<SalesDraftResult> {
  const url = submit ? '/api/drafts/sales/submission' : '/api/drafts/sales'
  const { data } = await apiClient.post<SalesDraftResult>(url, payload)
  return data
}
