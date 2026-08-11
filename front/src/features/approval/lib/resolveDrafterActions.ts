import type { DraftDetailResponse } from '../model/draftDetail'
import { resolveApprovalStatus } from './approvalStatusBadge'

export interface DrafterActionAvailability {
  isDrafter: boolean
  canSubmit: boolean
  canEdit: boolean
  canWithdraw: boolean
  canCancel: boolean
  canDelete: boolean
}

const NONE: DrafterActionAvailability = {
  isDrafter: false,
  canSubmit: false,
  canEdit: false,
  canWithdraw: false,
  canCancel: false,
  canDelete: false,
}

export function resolveDrafterActions(
  draft: DraftDetailResponse,
  myEmpId: number | undefined,
): DrafterActionAvailability {
  const isDrafter = myEmpId !== undefined && draft.drafter.empId === myEmpId
  if (!isDrafter) {
    return NONE
  }

  const base = { ...NONE, isDrafter: true }
  switch (resolveApprovalStatus(draft.approvalStatus)) {
    case 'UNSUBMITTED':
      return { ...base, canSubmit: true, canEdit: true, canDelete: true }
    case 'WAITING':
    case 'IN_PROGRESS':
      return { ...base, canWithdraw: true }
    case 'APPROVED':
      return { ...base, canCancel: draft.cancellationDraftId == null }
    case 'REJECTED':
      // 반려 상태는 삭제 불가(백엔드 정책: 미상신 상태에서만 삭제 가능)
      return base
    default:
      return base
  }
}
