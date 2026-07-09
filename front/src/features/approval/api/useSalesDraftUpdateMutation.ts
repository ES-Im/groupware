import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { updateSalesDraft, type SalesDraftUpdatePayload } from './updateSalesDraft'

/** useSalesDraftUpdateMutation 호출 변수. draftId 대상 기안 + payload 부분/전량 수정 값. */
interface SalesDraftUpdateVariables {
  draftId: number
  payload: SalesDraftUpdatePayload
}

/**
 * 매출 기안 수정 mutation 훅(`SALES_DRAFT_UPDATE`, F761, ROADMAP(SALES) T3.3).
 * 성공(204) 시 해당 기안 상세(approvalKeys.draftDetail)와 문서함 목록(approvalKeys.all)을 함께
 * invalidate해 수정 결과가 상세·임시저장함에 즉시 반영되게 한다(`useBusinessTripDraftUpdateMutation`
 * 동형). 실패(권한/상태 위반)는 에러를 그대로 던져 submitWithErrorMapping이 handleApiError로
 * 위임하도록 둔다.
 */
export function useSalesDraftUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, SalesDraftUpdateVariables>({
    mutationFn: ({ draftId, payload }) => updateSalesDraft(draftId, payload),
    onSuccess: async (_data, { draftId }) => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.draftDetail(draftId) })
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
