import { formatDraftDateTime } from '../../lib/approvalStatusBadge'
import { leaveTypeLabels, type LeaveType } from '../../model/leaveDraftSchema'
import type { DraftDetailSectionProps } from './types'

function resolveLeaveTypeLabel(leaveType: string): string {
  return leaveTypeLabels[leaveType as LeaveType] ?? leaveType
}

export function LeaveDraftBody({ draft }: DraftDetailSectionProps) {
  const { leave } = draft

  if (leave == null) {
    return null
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">휴가 유형</dt>
          <dd className="text-sm text-foreground">{resolveLeaveTypeLabel(leave.leaveType)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">휴가 기간</dt>
          <dd className="text-sm text-foreground">
            {formatDraftDateTime(leave.startAt)} ~ {formatDraftDateTime(leave.endAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">사용 시간</dt>
          <dd className="text-sm text-foreground">{leave.reservedHours}시간</dd>
        </div>
      </dl>

      <p className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {draft.content}
      </p>
    </div>
  )
}
