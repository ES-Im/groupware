import { Link } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { formatDraftDateTime, getApprovalStatusBadge } from '../../lib/approvalStatusBadge'
import { getApprovalStatusColor } from '../../lib/approvalStatusColor'
import { getDraftTypeMeta, resolveDraftTypeKey } from '../../lib/draftTypes'
import type { DraftDetailSectionProps } from './types'

export function DraftDetailHeader({ draft }: DraftDetailSectionProps) {
  const status = getApprovalStatusBadge(draft.approvalStatus)
  const statusColor = getApprovalStatusColor(draft.approvalStatus)
  const typeMeta = getDraftTypeMeta(resolveDraftTypeKey(draft))
  const TypeIcon = typeMeta.icon

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TypeIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">{typeMeta.label}</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight break-words">{draft.title}</h1>
          </div>
        </div>
        <Badge variant="outline" className={cn('shrink-0 gap-1.5', statusColor.className)}>
          <span className={cn('size-1.5 rounded-full', statusColor.dotClassName)} aria-hidden />
          {status.label}
        </Badge>
      </div>

      {draft.sourceDraftId != null && (
        <p className="text-sm text-muted-foreground">
          이 문서는 취소기안입니다 ·{' '}
          <Link
            to={`/approval/drafts/${draft.sourceDraftId}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            원본 기안 보기
          </Link>
        </p>
      )}
      {draft.cancellationDraftId != null && (
        <p className="text-sm text-muted-foreground">
          이 기안의 취소기안이 있습니다 ·{' '}
          <Link
            to={`/approval/drafts/${draft.cancellationDraftId}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            취소기안 보기
          </Link>
          {draft.cancellationSubmittedAt != null &&
            ` (상신 ${formatDraftDateTime(draft.cancellationSubmittedAt)})`}
        </p>
      )}
    </div>
  )
}
