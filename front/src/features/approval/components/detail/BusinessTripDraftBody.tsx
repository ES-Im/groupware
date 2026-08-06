import { useState } from 'react'
import { UserPen } from 'lucide-react'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Button } from '@/shared/ui/button'
import { formatDraftDateTime } from '../../lib/approvalStatusBadge'
import { resolveDrafterActions } from '../../lib/resolveDrafterActions'
import { BusinessTripParticipantsDialog } from './BusinessTripParticipantsDialog'
import type { DraftDetailSectionProps } from './types'

export function BusinessTripDraftBody({ draft }: DraftDetailSectionProps) {
  const { businessTrip } = draft
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false)

  const myEmpId = useMeQuery().data?.empBasicInfo?.empId
  const canEdit = resolveDrafterActions(draft, myEmpId).canEdit

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
