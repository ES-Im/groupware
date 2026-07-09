import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approvalKeys } from '../model/queryKeys'
import { rejectDraft } from './rejectDraft'

/** useRejectDraftMutation 호출 변수(반려 대상 draftId + 사유 reason). */
interface RejectDraftVariables {
  draftId: number
  reason: string
}

/**
 * 기안서 반려 mutation 훅(`DRAFT_REJECT`, F706, ROADMAP(DRAFT) T3.2).
 *
 * 반려 사유 다이얼로그(RejectDraftDialog, RHF+zod)에서 호출되므로, 승인 mutation과 달리 onError를
 * 두지 않는다 — 다이얼로그가 submitWithErrorMapping으로 감싸 실패를 handleApiError(setError/토스트)로
 * 위임하기 때문이다. 여기서 onError를 또 두면 에러 토스트가 이중으로 뜬다(CancellationDraftMutation과
 * 동일 컨벤션). 성공(204) 시 approvalKeys.all을 invalidate해 상세·문서함·뱃지를 일괄 갱신하고
 * 성공 토스트를 띄운다(반려 즉시 REJECTED 전이 → 상세 재조회로 반려 사유·상태 반영).
 */
export function useRejectDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, RejectDraftVariables>({
    mutationFn: ({ draftId, reason }) => rejectDraft(draftId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('기안서를 반려했습니다')
    },
  })
}
