import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  updateBusinessTripDraft,
  type BusinessTripDraftUpdatePayload,
} from './updateBusinessTripDraft'

interface BusinessTripDraftUpdateVariables {
  draftId: number
  payload: BusinessTripDraftUpdatePayload
}

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
