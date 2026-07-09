import { Link } from 'react-router'
import { Badge } from '@/shared/ui/badge'
import { formatDraftDateTime, getApprovalStatusBadge } from '../../lib/approvalStatusBadge'
import type { DraftDetailSectionProps } from './types'

/**
 * 기안서 상세 공통 헤더(ROADMAP(DRAFT) T2.3): 제목 · 기안자 · 상태 배지 · 상신일시 +
 * 취소기안 관계 링크(sourceDraftId/cancellationDraftId). read-only 표시 전용.
 *
 * 취소기안 관계(Open Q#2 회피 — draftType enum 미의존):
 * - sourceDraftId != null → 이 문서가 "취소기안"이며 원본 기안으로 이동하는 링크.
 * - cancellationDraftId != null → 이 문서(원본)에 대한 취소기안이 있으며 그 취소기안으로 이동하는 링크.
 * 링크 목적지 `/approval/drafts/:draftId`는 M2 T2.5에서 등록된다.
 */
export function DraftDetailHeader({ draft }: DraftDetailSectionProps) {
  const status = getApprovalStatusBadge(draft.approvalStatus)

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <h1 className="text-xl font-semibold tracking-tight break-words">{draft.title}</h1>
      <p className="text-sm text-muted-foreground">
        기안자 {draft.drafter.empName} · 상신 {formatDraftDateTime(draft.submittedAt)}
      </p>

      {/* 취소기안 관계 링크(read-only). 있는 경우에만 노출한다. */}
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
