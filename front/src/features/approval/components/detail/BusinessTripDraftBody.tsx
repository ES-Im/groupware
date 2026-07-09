import { useState } from 'react'
import { UserPen } from 'lucide-react'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Button } from '@/shared/ui/button'
import { formatDraftDateTime } from '../../lib/approvalStatusBadge'
import { resolveDrafterActions } from '../../lib/resolveDrafterActions'
import { BusinessTripParticipantsDialog } from './BusinessTripParticipantsDialog'
import type { DraftDetailSectionProps } from './types'

/**
 * 출장 기안 상세 본문(F732, ROADMAP(DRAFT-BUSINESSTRIP) T3.1·T3.4).
 *
 * `DraftTypeBody`(①선례)의 `draft.businessTrip != null` "준비 중" 폴백을 교체한다. 신규 조회 없이
 * `DRAFT_DETAIL`(F701, ①)이 이미 내려준 `businessTrip` 슬롯(`BusinessTripSlot`)과 공통 `content`를
 * 렌더한다 — 기간은 dayjs 포맷(`formatDraftDateTime`, ①선례 재사용).
 *
 * `[참여자 수정]` 버튼(T3.4)은 `resolveDrafterActions(draft, myEmpId).canEdit`(기안자 본인 +
 * UNSUBMITTED, ①판정 소비 — 재작성 금지)일 때만 노출한다. `myEmpId`는 `DrafterActions`와 동형으로
 * `useMeQuery().data?.empBasicInfo?.empId`(로딩 전/실패 시 undefined → fail-closed 미노출).
 */
export function BusinessTripDraftBody({ draft }: DraftDetailSectionProps) {
  const { businessTrip } = draft
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false)

  const myEmpId = useMeQuery().data?.empBasicInfo?.empId
  const canEdit = resolveDrafterActions(draft, myEmpId).canEdit

  // DraftTypeBody가 이미 businessTrip != null일 때만 이 컴포넌트를 렌더하지만, 타입상
  // BusinessTripSlot | null이라 방어적으로 좁힌다(호출부 계약 위반 시 조용히 아무것도 렌더하지 않음).
  if (businessTrip == null) {
    return null
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">출장 기간</dt>
          <dd className="text-sm text-foreground">
            {formatDraftDateTime(businessTrip.startAt)} ~ {formatDraftDateTime(businessTrip.endAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">목적지</dt>
          <dd className="text-sm text-foreground">{businessTrip.destination}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">목적</dt>
          <dd className="text-sm text-foreground">{businessTrip.purpose}</dd>
        </div>
      </dl>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">참여자</p>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setParticipantsDialogOpen(true)}
            >
              <UserPen />
              참여자 수정
            </Button>
          )}
        </div>
        {businessTrip.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">지정된 참여자가 없습니다.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {businessTrip.participants.map((participant) => (
              <li
                key={participant.empId}
                className="rounded-full border bg-muted px-2.5 py-1 text-xs text-foreground"
              >
                {participant.empName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {draft.content}
      </p>

      {canEdit && (
        <BusinessTripParticipantsDialog
          draftId={draft.draftId}
          participants={businessTrip.participants}
          open={participantsDialogOpen}
          onOpenChange={setParticipantsDialogOpen}
        />
      )}
    </div>
  )
}
