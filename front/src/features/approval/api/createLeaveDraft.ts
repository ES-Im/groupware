import { apiClient } from '@/shared/api/client'
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

export interface LeaveDraftResult {
  draftId: number
}

export async function createLeaveDraft(
  payload: LeaveDraftPayload,
  submit: boolean,
): Promise<LeaveDraftResult> {
  const url = submit ? '/api/drafts/leaves/submission' : '/api/drafts/leaves'
  const { data } = await apiClient.post<LeaveDraftResult>(url, payload)
  return data
}
