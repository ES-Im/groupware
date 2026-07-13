import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { formatDraftDateTime, getApprovalRoleLabel } from '../../lib/approvalStatusBadge'
import type { DraftApprover } from '../../model/draftDetail'
import type { DraftDetailSectionProps } from './types'

/**
 * 결재선 타임라인(ROADMAP(DRAFT) T2.3): approvers[]를 order 오름차순으로 나열하고 각 결재자의
 * 이름·역할(APPROVER/COOPERATOR 라벨)·처리 상태(승인/반려/대기)를 read-only로 표시한다.
 * 승인/반려 액션 버튼은 M3(ApproverActions)가 별도 슬롯에서 담당한다 — 여기서는 표시만 한다.
 *
 * 처리 상태 판정(응답 필드 파생, read-only):
 * - approvedAt != null → 승인(+일시)
 * - rejectedAt != null → 반려(+일시, rejectReason)
 * - 둘 다 null → 대기(미처리)
 */
function approverStateBadge(approver: DraftApprover) {
  if (approver.approvedAt != null) {
    return { label: '승인', variant: 'default' as const }
  }
  if (approver.rejectedAt != null) {
    return { label: '반려', variant: 'destructive' as const }
  }
  return { label: '대기', variant: 'outline' as const }
}

export function ApprovalLineTimeline({ draft }: DraftDetailSectionProps) {
  // 서버 정렬을 신뢰하지 않고 order 오름차순으로 표시 정렬한다(원본 배열 불변 — 복사 후 정렬).
  const approvers = [...draft.approvers].sort((a, b) => a.order - b.order)

  return (
    // 독립 카드(CardContent) 안에서 렌더되므로 자체 상단 구분선은 두지 않는다(레퍼런스 사이드 카드).
    <section className="space-y-3">
      <h3 className="text-base font-bold text-foreground">결재선</h3>
      {approvers.length === 0 ? (
        <p className="text-sm text-muted-foreground">지정된 결재자가 없습니다.</p>
      ) : (
        <ol className="space-y-0">
          {approvers.map((approver) => {
            const state = approverStateBadge(approver)
            const processedAt = approver.approvedAt ?? approver.rejectedAt
            const isDone = approver.approvedAt != null
            return (
              <li
                key={`${approver.order}-${approver.empId}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-3 text-sm last:border-0"
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : approver.order}
                </span>
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-violet-700">
                    {approver.empName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{approver.empName}</span>
                <span className="text-xs text-muted-foreground">
                  {getApprovalRoleLabel(approver.role)}
                </span>
                <Badge variant={state.variant} className="ml-auto">
                  {state.label}
                </Badge>
                {processedAt != null && (
                  <span className="w-full pl-9 text-xs text-muted-foreground tabular-nums sm:w-auto sm:pl-0">
                    {formatDraftDateTime(processedAt)}
                  </span>
                )}
                {approver.rejectedAt != null && approver.rejectReason != null && (
                  <p className="w-full pl-9 text-xs text-muted-foreground">
                    반려 사유: {approver.rejectReason}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
