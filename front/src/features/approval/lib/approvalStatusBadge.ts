import dayjs from 'dayjs'
import { Paperclip, type LucideIcon } from 'lucide-react'
import type { ApprovalStatus } from '@/features/approval/model/approval'

export type ApprovalBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface ApprovalStatusBadgeInfo {
  label: string
  variant: ApprovalBadgeVariant
}

export const approvalStatusBadgeMap: Record<ApprovalStatus, ApprovalStatusBadgeInfo> = {
  UNSUBMITTED: { label: '미상신', variant: 'outline' },
  WAITING: { label: '결재대기', variant: 'secondary' },
  IN_PROGRESS: { label: '결재진행중', variant: 'secondary' },
  APPROVED: { label: '결재완료', variant: 'default' },
  REJECTED: { label: '반려', variant: 'destructive' },
}

const APPROVAL_STATUS_BY_LABEL: Record<string, ApprovalStatus> = Object.fromEntries(
  (Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]).map((code) => [
    approvalStatusBadgeMap[code].label,
    code,
  ]),
)

export function resolveApprovalStatus(displayName: string): ApprovalStatus | undefined {
  return APPROVAL_STATUS_BY_LABEL[displayName]
}

export function getApprovalStatusBadge(displayName: string): ApprovalStatusBadgeInfo {
  const code = resolveApprovalStatus(displayName)
  return code ? approvalStatusBadgeMap[code] : { label: displayName, variant: 'outline' }
}

export function getApprovalRoleLabel(role: string): string {
  switch (role) {
    case 'APPROVER':
      return '결재'
    case 'COOPERATOR':
      return '협조'
    default:
      return role
  }
}

export function formatDraftDateTime(value: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

export interface FileAttachedIconInfo {
  Icon: LucideIcon | null
  ariaLabel: string
}

export function getFileAttachedIconInfo(isFileAttached: boolean): FileAttachedIconInfo {
  return isFileAttached
    ? { Icon: Paperclip, ariaLabel: '첨부파일 있음' }
    : { Icon: null, ariaLabel: '첨부파일 없음' }
}
