export type ApprovalRole = 'APPROVER' | 'COOPERATOR'

export const APPROVAL_ROLE_OPTIONS: { value: ApprovalRole; label: string }[] = [
  { value: 'APPROVER', label: '결재' },
  { value: 'COOPERATOR', label: '협조' },
]

export function toApprovalRole(role: string): ApprovalRole {
  return role === 'COOPERATOR' ? 'COOPERATOR' : 'APPROVER'
}

export interface ApproverParam {
  approverId: number
  role: ApprovalRole
  order: number
}
