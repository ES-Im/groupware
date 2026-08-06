import type { DraftApprover } from '../model/draftDetail'

export function isMyApprovalTurn(
  approvers: DraftApprover[],
  myEmpId: number | undefined,
): boolean {
  if (myEmpId === undefined) {
    return false
  }

  const me = approvers.find((approver) => approver.empId === myEmpId)
  if (!me || isProcessed(me)) {
    return false
  }

  const pendingOrders = approvers.filter((approver) => !isProcessed(approver)).map((a) => a.order)
  return me.order === Math.min(...pendingOrders)
}

function isProcessed(approver: DraftApprover): boolean {
  return approver.approvedAt !== null || approver.rejectedAt !== null
}
