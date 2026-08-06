import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { updateLeaveDraft, type LeaveDraftUpdatePayload } from './updateLeaveDraft'

interface LeaveDraftUpdateVariables {
  draftId: number
  payload: LeaveDraftUpdatePayload
}

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
