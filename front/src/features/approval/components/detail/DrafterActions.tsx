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

/**
 * 기안자 액션 버튼 슬롯(ROADMAP(DRAFT) M4 T4.3).
 *
 * 기안자 본인의 상태별 액션을 노출한다(판정=resolveDrafterActions, T4.1):
 *   - UNSUBMITTED → [상신](F702) / [수정](유형별 작성 PRD — 미구현 폴백, Open Q#3)
 *   - WAITING·IN_PROGRESS → [상신 철회](F703)
 *   - APPROVED + 취소기안 없음 → [취소 기안 작성](F704 전용 페이지로 이동 — 모달 아님, 2026-07-14)
 * 상신/철회 성공 시 mutation onSuccess가 approvalKeys.all을 invalidate해 상세·문서함이 즉시 갱신되고,
 * 규칙 위반(차례/상태/기안자)은 handleApiError가 토스트로 위임한다(최종 판단은 서버 — PRD §접근 권한).
 *
 * 본인 판정: `draft.drafter.empId === useMeQuery().data.empBasicInfo.empId`(numeric empId, me 응답에
 * 보강된 사원 PK — model/me.ts). me 로딩 전/실패 시 empId는 undefined이며, resolveDrafterActions가
 * undefined → isDrafter=false로 처리해 버튼을 노출하지 않는다(fail-closed). 최종 판단은 서버가 하므로
 * 노출된 버튼이라도 규칙 위반 시 서버가 403/도메인 에러로 막고 handleApiError가 토스트로 처리한다.
 *
 * props는 `{ draft }` 고정 계약을 유지한다(types.ts DraftDetailSectionProps).
 */
export function DrafterActions({ draft }: DraftDetailSectionProps) {
  const navigate = useNavigate()
  const meQuery = useMeQuery()
  const submitMutation = useDraftSubmitMutation()
  const withdrawMutation = useDraftSubmissionWithdrawalMutation()

  // me 로딩 전/실패 시 undefined → resolveDrafterActions가 isDrafter=false로 처리(버튼 미노출).
  const myEmpId = meQuery.data?.empBasicInfo?.empId
  const availability = resolveDrafterActions(draft, myEmpId)

  // 기안자 본인이 아니면 아무 액션도 노출하지 않는다 — 빈 슬롯.
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

  // [수정] 배선(②일반 기안 T2.4 + ③출장 기안 T2.4 + ④연가 M6 T6.1 + ⑤매출 ROADMAP(SALES) M4 T4.1):
  // 일반 기안(슬롯-null 술어 isGeneralDraft)이면 일반 기안 수정 페이지로, 출장 기안(슬롯-null 술어
  // isBusinessTripDraft)이면 출장 기안 수정 페이지로, 휴가 기안(슬롯-null 술어 isLeaveDraft)이면
  // 휴가 기안 수정 페이지로, 매출 기안(슬롯-null 술어 isSalesDraft)이면 매출 기안 수정 페이지로
  // 이동한다. 전 유형 분기 완료라 폴백 토스트는 미분류 상태를 대비한 안전망으로만 남긴다.
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
