import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { useDraftSubmissionWithdrawalMutation } from '../../api/useDraftSubmissionWithdrawalMutation'
import { useDraftSubmitMutation } from '../../api/useDraftSubmitMutation'
import { isBusinessTripDraft } from '../../lib/isBusinessTripDraft'
import { isGeneralDraft } from '../../lib/isGeneralDraft'
import { isLeaveDraft } from '../../lib/isLeaveDraft'
import { isSalesDraft } from '../../lib/isSalesDraft'
import { resolveDrafterActions } from '../../lib/resolveDrafterActions'
import type { DraftDetailSectionProps } from './types'

export function DrafterActions({ draft }: DraftDetailSectionProps) {
  const navigate = useNavigate()
  const meQuery = useMeQuery()
  const submitMutation = useDraftSubmitMutation()
  const withdrawMutation = useDraftSubmissionWithdrawalMutation()

  const myEmpId = meQuery.data?.empBasicInfo?.empId
  const availability = resolveDrafterActions(draft, myEmpId)

  if (!availability.isDrafter) {
    return null
  }

  function handleSubmit() {
    submitMutation.mutate(
      { draftId: draft.draftId },
      {
        onSuccess: () => toast.success('기안서를 상신했습니다'),
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  function handleWithdraw() {
    withdrawMutation.mutate(draft.draftId, {
      onSuccess: () => toast.success('상신을 철회했습니다'),
      onError: (error) => handleApiError(error, { toast }),
    })
  }

  function handleEdit() {
    if (isGeneralDraft(draft)) {
      navigate(`/approval/drafts/${draft.draftId}/edit`)
      return
    }
    if (isBusinessTripDraft(draft)) {
      navigate(`/approval/drafts/business-trips/${draft.draftId}/edit`)
      return
    }
    if (isLeaveDraft(draft)) {
      navigate(`/approval/drafts/leaves/${draft.draftId}/edit`)
      return
    }
    if (isSalesDraft(draft)) {
      navigate(`/approval/drafts/sales/${draft.draftId}/edit`)
      return
    }
    toast.info('해당 유형 작성 화면은 준비 중입니다')
  }

  const isMutating = submitMutation.isPending || withdrawMutation.isPending

  return (
    <>
      {availability.canSubmit && (
        <Button
          type="button"
          size="sm"
          className="rounded-lg"
          onClick={handleSubmit}
          disabled={isMutating}
        >
          상신
        </Button>
      )}
      {availability.canEdit && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg"
          onClick={handleEdit}
        >
          수정
        </Button>
      )}
      {availability.canWithdraw && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg"
          onClick={handleWithdraw}
          disabled={isMutating}
        >
          상신 철회
        </Button>
      )}
      {availability.canCancel && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg"
          onClick={() => navigate(`/approval/drafts/${draft.draftId}/cancellation`)}
        >
          취소 기안 작성
        </Button>
      )}
    </>
  )
}
