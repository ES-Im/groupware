import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  createCancellationDraft,
  type CancellationDraftPayload,
  type CancellationDraftResult,
} from './createCancellationDraft'

interface CancellationDraftVariables {
  sourceDraftId: number
  payload: CancellationDraftPayload
  submit: boolean
}

export function useCancellationDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<CancellationDraftResult, unknown, CancellationDraftVariables>({
    mutationFn: ({ sourceDraftId, payload, submit }) =>
      createCancellationDraft(sourceDraftId, payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
