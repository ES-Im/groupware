import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import { approvalKeys } from '../model/queryKeys'
import {
  createCancellationDraft,
  type CancellationDraftPayload,
} from './createCancellationDraft'

interface CancellationDraftVariables {
  sourceDraftId: number
  payload: CancellationDraftPayload
  submit: boolean
}

export function useCancellationDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<RegisterDomainIdResponse, unknown, CancellationDraftVariables>({
    mutationFn: ({ sourceDraftId, payload, submit }) =>
      createCancellationDraft(sourceDraftId, payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
