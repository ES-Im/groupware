import { useState } from 'react'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Button } from '@/shared/ui/button'
import { useApproveDraftMutation } from '../../api/useApproveDraftMutation'
import { isMyApprovalTurn } from '../../lib/approverTurn'
import { RejectDraftDialog } from './RejectDraftDialog'
import type { DraftDetailSectionProps } from './types'

export function ApproverActions({ draft }: DraftDetailSectionProps) {
  const { data: me } = useMeQuery()
  const approveMutation = useApproveDraftMutation()
  const [rejectOpen, setRejectOpen] = useState(false)

  const myEmpId = me?.empBasicInfo?.empId
  if (!isMyApprovalTurn(draft.approvers, myEmpId)) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        className="rounded-lg"
        onClick={() => approveMutation.mutate(draft.draftId)}
        disabled={approveMutation.isPending}
      >
        승인
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="rounded-lg"
        onClick={() => setRejectOpen(true)}
      >
        반려
      </Button>

      <RejectDraftDialog draftId={draft.draftId} open={rejectOpen} onOpenChange={setRejectOpen} />
    </div>
  )
}
