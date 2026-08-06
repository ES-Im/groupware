import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { updateSalesDraft, type SalesDraftUpdatePayload } from './updateSalesDraft'

interface SalesDraftUpdateVariables {
  draftId: number
  payload: SalesDraftUpdatePayload
}

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
