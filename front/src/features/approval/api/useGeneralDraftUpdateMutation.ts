import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { updateGeneralDraft, type GeneralDraftUpdatePayload } from './updateGeneralDraft'

interface GeneralDraftUpdateVariables {
  draftId: number
  payload: GeneralDraftUpdatePayload
}

export function useGeneralDraftUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, GeneralDraftUpdateVariables>({
    mutationFn: ({ draftId, payload }) => updateGeneralDraft(draftId, payload),
    onSuccess: async (_data, { draftId }) => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.draftDetail(draftId) })
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
