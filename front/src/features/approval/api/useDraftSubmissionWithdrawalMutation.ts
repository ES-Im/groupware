import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { withdrawDraftSubmission } from './withdrawDraftSubmission'

/**
 * 기안서 상신 철회 mutation 훅(`DRAFT_SUBMISSION_WITHDRAWAL`, F703, ROADMAP(DRAFT) T4.2).
 * 성공(204) 시 approvalKeys.all을 invalidate해 상세와 관련 문서함 목록(상신함/임시저장함)이
 * 재조회되도록 한다. 실패(상태/기안자 위반 등)는 에러를 그대로 던져 호출부(T4.3)가
 * handleApiError로 위임하도록 둔다.
 */
export function useDraftSubmissionWithdrawalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => withdrawDraftSubmission(draftId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
