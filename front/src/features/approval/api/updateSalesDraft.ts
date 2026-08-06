import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

export interface SalesDraftUpdatePayload {
  param?: {
    title?: string
    content?: string
    approvers?: ApproverParam[]
  }
  franchiseId?: number
  reportMonth?: string
  salesAmount?: number
}

export async function updateSalesDraft(
  draftId: number,
  payload: SalesDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/sales/${draftId}`, payload)
}
