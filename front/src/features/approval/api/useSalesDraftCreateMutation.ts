import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import { approvalKeys } from '../model/queryKeys'
import { createSalesDraft, type SalesDraftPayload } from './createSalesDraft'

interface SalesDraftCreateVariables {
  payload: SalesDraftPayload
  submit: boolean
}

export function useSalesDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<RegisterDomainIdResponse, unknown, SalesDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createSalesDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
