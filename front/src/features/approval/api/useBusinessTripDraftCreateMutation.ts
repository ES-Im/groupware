import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  createBusinessTripDraft,
  type BusinessTripDraftPayload,
  type BusinessTripDraftResult,
} from './createBusinessTripDraft'

interface BusinessTripDraftCreateVariables {
  payload: BusinessTripDraftPayload
  submit: boolean
}

export function useBusinessTripDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<BusinessTripDraftResult, unknown, BusinessTripDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createBusinessTripDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
