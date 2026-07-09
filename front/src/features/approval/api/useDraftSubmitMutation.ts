import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { ApproverParam } from '../model/approverParam'
import { submitDraft } from './submitDraft'

/** useDraftSubmitMutation 호출 변수. approvers 생략 시 기존 결재선으로 상신(MVP). */
interface DraftSubmitVariables {
  draftId: number
  approvers?: ApproverParam[]
}

/**
 * 기안서 상신 mutation 훅(`DRAFT_SUBMIT`, F702, ROADMAP(DRAFT) T4.2).
 * 성공(204) 시 approvalKeys.all을 invalidate해 상세와 관련 문서함 목록(상신함/임시저장함)이
 * 재조회되도록 한다. 실패(차례/상태/기안자 위반 등)는 에러를 그대로 던져 호출부(T4.3)가
 * handleApiError로 위임하도록 둔다(useDraftFileDeleteMutation 복제).
 */
export function useDraftSubmitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, approvers }: DraftSubmitVariables) => submitDraft(draftId, approvers),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
