import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  updateBusinessTripDraft,
  type BusinessTripDraftUpdatePayload,
} from './updateBusinessTripDraft'

/** useBusinessTripDraftUpdateMutation 호출 변수. draftId 대상 기안 + payload 부분/전량 수정 값. */
interface BusinessTripDraftUpdateVariables {
  draftId: number
  payload: BusinessTripDraftUpdatePayload
}

/**
 * 출장 기안 수정 mutation 훅(`BUSINESS_TRIP_DRAFT_UPDATE`, F731, ROADMAP(DRAFT-BUSINESSTRIP) T2.2).
 * 성공(204) 시 해당 기안 상세(approvalKeys.draftDetail)와 문서함 목록(approvalKeys.all)을 함께
 * invalidate해 수정 결과가 상세·임시저장함/내 출장 이력에 즉시 반영되게 한다
 * (`useGeneralDraftUpdateMutation` 동형). 실패(권한/상태 위반)는 에러를 그대로 던져
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export function useBusinessTripDraftUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, BusinessTripDraftUpdateVariables>({
    mutationFn: ({ draftId, payload }) => updateBusinessTripDraft(draftId, payload),
    onSuccess: async (_data, { draftId }) => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.draftDetail(draftId) })
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
