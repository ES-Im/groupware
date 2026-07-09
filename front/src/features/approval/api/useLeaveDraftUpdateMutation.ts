import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { updateLeaveDraft, type LeaveDraftUpdatePayload } from './updateLeaveDraft'

/** useLeaveDraftUpdateMutation 호출 변수. draftId 대상 기안 + payload 부분/전량 수정 값. */
interface LeaveDraftUpdateVariables {
  draftId: number
  payload: LeaveDraftUpdatePayload
}

/**
 * 휴가 기안 수정 mutation 훅(`LEAVE_DRAFT_UPDATE`, F741, ROADMAP(LEAVE) T2.3).
 * 성공(204) 시 해당 기안 상세(approvalKeys.draftDetail)와 문서함 목록(approvalKeys.all)을 함께
 * invalidate해 수정 결과가 상세·임시저장함/내 휴가 이력에 즉시 반영되게 한다
 * (`useBusinessTripDraftUpdateMutation` 동형). 실패(권한/상태 위반)는 에러를 그대로 던져
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export function useLeaveDraftUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, LeaveDraftUpdateVariables>({
    mutationFn: ({ draftId, payload }) => updateLeaveDraft(draftId, payload),
    onSuccess: async (_data, { draftId }) => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.draftDetail(draftId) })
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
