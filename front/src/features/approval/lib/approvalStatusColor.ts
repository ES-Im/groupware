import type { ApprovalStatus } from '../model/approval'
import { resolveApprovalStatus } from './approvalStatusBadge'

export interface ApprovalStatusColor {
  className: string
  dotClassName: string
}

const APPROVAL_STATUS_COLOR: Record<ApprovalStatus, ApprovalStatusColor> = {
  UNSUBMITTED: {
    className:
      'border-0 bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    dotClassName: 'bg-slate-400',
  },
  WAITING: {
    className:
      'border-0 bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900',
    dotClassName: 'bg-amber-500',
  },
  IN_PROGRESS: {
    className:
      'border-0 bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900',
    dotClassName: 'bg-blue-500',
  },
  APPROVED: {
    className:
      'border-0 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900',
    dotClassName: 'bg-emerald-500',
  },
  REJECTED: {
    className:
      'border-0 bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900',
    dotClassName: 'bg-rose-500',
  },
}

const FALLBACK_COLOR: ApprovalStatusColor = {
  className: 'border-0 bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  dotClassName: 'bg-slate-400',
}

export function getApprovalStatusColor(displayName: string): ApprovalStatusColor {
  const code = resolveApprovalStatus(displayName)
  return code ? APPROVAL_STATUS_COLOR[code] : FALLBACK_COLOR
}
