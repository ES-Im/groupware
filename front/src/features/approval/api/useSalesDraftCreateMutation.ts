import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { createSalesDraft, type SalesDraftPayload, type SalesDraftResult } from './createSalesDraft'

/** useSalesDraftCreateMutation 호출 변수. submit=false 생성(임시저장) / true 생성+상신. */
interface SalesDraftCreateVariables {
  payload: SalesDraftPayload
  submit: boolean
}

/**
 * 매출 기안 생성/상신 mutation 훅(`SALES_DRAFT_CREATE(_SUBMISSION)`, F760, ROADMAP(SALES) T2.2).
 * 성공(201, `{draftId}`) 시 approvalKeys.all을 invalidate해 상신함/임시저장함 목록을 최신화한 뒤,
 * 반환된 draftId로 호출부(작성 페이지)가 새 기안 상세로 이동한다. 실패는 에러를 그대로 던져
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다(useBusinessTripDraftCreateMutation 동형).
 */
export function useSalesDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<SalesDraftResult, unknown, SalesDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createSalesDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
