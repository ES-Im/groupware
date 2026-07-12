import { Link } from 'react-router'
import { Badge } from '@/shared/ui/badge'
import { formatDraftDateTime, getApprovalStatusBadge } from '../../lib/approvalStatusBadge'
import { getDraftTypeMeta, resolveDraftTypeKey } from '../../lib/draftTypes'
import type { DraftDetailSectionProps } from './types'

/**
 * 기안서 상세 공통 헤더(레퍼런스 상세 카드 헤더 이식): 유형 아이콘 배지 + 유형 라벨 + 제목(좌) /
 * 상태 배지(우) + 취소기안 관계 링크. read-only 표시 전용. 기안자·상신일시는 여기가 아니라
 * 본문 상단 메타 4칸(DraftDetailPage)이 표시한다.
 *
 * 유형 판별은 draftType enum이 아니라 슬롯 non-null 체크(resolveDraftTypeKey — Open Q#2 회피).
 *
 * 취소기안 관계(sourceDraftId/cancellationDraftId):
 * - sourceDraftId != null → 이 문서가 "취소기안"이며 원본 기안으로 이동하는 링크.
 * - cancellationDraftId != null → 이 문서(원본)에 대한 취소기안이 있으며 그 취소기안으로 이동하는 링크.
 */
export function DraftDetailHeader({ draft }: DraftDetailSectionProps) {
  const status = getApprovalStatusBadge(draft.approvalStatus)
  const typeMeta = getDraftTypeMeta(resolveDraftTypeKey(draft))
  const TypeIcon = typeMeta.icon

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <TypeIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{typeMeta.label}</p>
            <h1 className="text-xl font-semibold tracking-tight break-words">{draft.title}</h1>
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

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
