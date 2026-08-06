import { cn } from '@/shared/lib/utils'
import { formatDraftDateTime, getApprovalRoleLabel } from '../../lib/approvalStatusBadge'
import type { DraftDetailSectionProps } from './types'

interface HistoryEvent {
  key: string
  label: string
  actorName: string
  at: string
  dotClassName: string
}

export function DraftHistorySection({ draft }: DraftDetailSectionProps) {
  const events: HistoryEvent[] = []

  if (draft.submittedAt != null) {
    events.push({
      key: 'submitted',
      label: '문서 상신',
      actorName: draft.drafter.empName,
      at: draft.submittedAt,
      dotClassName: 'border-primary',
    })
  }
  for (const approver of draft.approvers) {
    if (approver.approvedAt != null) {
      events.push({
        key: `approved-${approver.order}-${approver.empId}`,
        label: `${getApprovalRoleLabel(approver.role)} 승인`,
        actorName: approver.empName,
        at: approver.approvedAt,
        dotClassName: 'border-primary',
      })
    }
    if (approver.rejectedAt != null) {
      events.push({
        key: `rejected-${approver.order}-${approver.empId}`,
        label: '반려',
        actorName: approver.empName,
        at: approver.rejectedAt,
        dotClassName: 'border-destructive',
      })
    }
  }
  events.sort((a, b) => a.at.localeCompare(b.at))

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold text-foreground">처리 이력</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">처리 이력이 없습니다.</p>
      ) : (
        <ul className="ml-1">
          {events.map((event, index) => (
            <li
              key={event.key}
              className={cn(
                'relative border-l pb-4 pl-5 text-sm last:border-transparent last:pb-0',
                index === events.length - 1 ? 'border-transparent' : 'border-border',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 -left-[5px] size-2.5 rounded-full border-2 bg-card',
                  event.dotClassName,
                )}
                aria-hidden
              />
              <p className="font-medium text-foreground">{event.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {event.actorName} · {formatDraftDateTime(event.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
