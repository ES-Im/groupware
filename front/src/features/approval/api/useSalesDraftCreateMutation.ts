import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { createSalesDraft, type SalesDraftPayload, type SalesDraftResult } from './createSalesDraft'

interface SalesDraftCreateVariables {
  payload: SalesDraftPayload
  submit: boolean
}

export function useSalesDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<SalesDraftResult, unknown, SalesDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createSalesDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
