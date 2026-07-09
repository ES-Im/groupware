import { useState } from 'react'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Button } from '@/shared/ui/button'
import { useApproveDraftMutation } from '../../api/useApproveDraftMutation'
import { isMyApprovalTurn } from '../../lib/approverTurn'
import { RejectDraftDialog } from './RejectDraftDialog'
import type { DraftDetailSectionProps } from './types'

/**
 * 결재자 액션 버튼 슬롯(ROADMAP(DRAFT) M3 T3.3 — F705 승인 · F706 반려).
 *
 * "현재 내 결재 차례"일 때만 [승인]/[반려] 버튼을 노출한다(판정=isMyApprovalTurn, T3.1). 본인 식별은
 * useMeQuery 응답의 numeric empId(empBasicInfo.empId)로 하며, 아직 empId를 못 받은 과도기(로딩/부재)엔
 * 판정이 false를 반환해 버튼이 뜨지 않는다(안전 처리). 승인은 단발 mutation(T3.2), 반려는 사유
 * 다이얼로그(RejectDraftDialog, RHF+zod)를 거친다. 최종 인가는 서버가 하며(Open Q#4), 노출은 힌트다.
 */
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
        onClick={() => approveMutation.mutate(draft.draftId)}
        disabled={approveMutation.isPending}
      >
        승인
      </Button>
      <Button type="button" variant="destructive" onClick={() => setRejectOpen(true)}>
        반려
      </Button>

      <RejectDraftDialog draftId={draft.draftId} open={rejectOpen} onOpenChange={setRejectOpen} />
    </div>
  )
}
