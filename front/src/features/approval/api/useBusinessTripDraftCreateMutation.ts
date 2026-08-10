import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import { approvalKeys } from '../model/queryKeys'
import { createBusinessTripDraft, type BusinessTripDraftPayload } from './createBusinessTripDraft'

interface BusinessTripDraftCreateVariables {
  payload: BusinessTripDraftPayload
  submit: boolean
}

export function useBusinessTripDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<RegisterDomainIdResponse, unknown, BusinessTripDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createBusinessTripDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
