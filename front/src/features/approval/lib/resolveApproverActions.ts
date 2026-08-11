import type { DraftDetailResponse } from '../model/draftDetail'
import { resolveApprovalStatus } from './approvalStatusBadge'
import { isMyApprovalTurn } from './approverTurn'

export interface ApproverActionAvailability {
  canApprove: boolean
  canReject: boolean
}

const NONE: ApproverActionAvailability = { canApprove: false, canReject: false }

export function resolveApproverActions(
  draft: DraftDetailResponse,
  myEmpId: number | undefined,
): ApproverActionAvailability {
  const status = resolveApprovalStatus(draft.approvalStatus)
  if (status !== 'WAITING' && status !== 'IN_PROGRESS') {
    return NONE
  }
  if (!isMyApprovalTurn(draft.approvers, myEmpId)) {
    return NONE
  }
  return { canApprove: true, canReject: true }
}
