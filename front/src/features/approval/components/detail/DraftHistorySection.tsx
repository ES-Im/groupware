import { CircleCheck, CircleX, Send, type LucideIcon } from 'lucide-react'
import { formatDraftDateTime, getApprovalRoleLabel } from '../../lib/approvalStatusBadge'
import type { DraftDetailSectionProps } from './types'

interface HistoryEvent {
  key: string
  label: string
  actorName: string
  /** 발생 일시(`yyyy-MM-dd'T'HH:mm:ss` — ISO 형식이라 문자열 정렬이 시간순 정렬과 일치). */
  at: string
  icon: LucideIcon
  iconClassName: string
}

/**
 * 처리 이력(레퍼런스 상세 우측 "처리 이력" 카드 이식). 별도 이력 API가 없으므로 DRAFT_DETAIL
 * 응답에서 파생 가능한 사건만 나열한다(read-only, 데이터 발명 없음):
 * - 문서 상신(submittedAt — 미상신 문서는 이력 없음)
 * - 결재 승인/반려(approvers[].approvedAt/rejectedAt)
 * 발생 시각 오름차순으로 정렬해 타임라인처럼 읽히게 한다.
 */
export function DraftHistorySection({ draft }: DraftDetailSectionProps) {
  const events: HistoryEvent[] = []

  if (draft.submittedAt != null) {
    events.push({
      key: 'submitted',
      label: '문서 상신',
      actorName: draft.drafter.empName,
      at: draft.submittedAt,
      icon: Send,
      iconClassName: 'text-primary',
    })
  }
  for (const approver of draft.approvers) {
    if (approver.approvedAt != null) {
      events.push({
        key: `approved-${approver.order}-${approver.empId}`,
        // 역할별 라벨(결재 승인/협조 승인 — getApprovalRoleLabel 어휘로 협조자의 처리를 구분).
        label: `${getApprovalRoleLabel(approver.role)} 승인`,
        actorName: approver.empName,
        at: approver.approvedAt,
        icon: CircleCheck,
        iconClassName: 'text-primary',
      })
    }
    if (approver.rejectedAt != null) {
      events.push({
        key: `rejected-${approver.order}-${approver.empId}`,
        label: '반려',
        actorName: approver.empName,
        at: approver.rejectedAt,
        icon: CircleX,
        iconClassName: 'text-destructive',
      })
    }
  }
  events.sort((a, b) => a.at.localeCompare(b.at))

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">처리 이력</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">처리 이력이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const EventIcon = event.icon
            return (
              <li key={event.key} className="flex gap-3 text-sm">
                <EventIcon className={`mt-0.5 size-4 shrink-0 ${event.iconClassName}`} />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{event.label}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {event.actorName} · {formatDraftDateTime(event.at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
