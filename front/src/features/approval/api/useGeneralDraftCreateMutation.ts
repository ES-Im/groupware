import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  createGeneralDraft,
  type GeneralDraftPayload,
  type GeneralDraftResult,
} from './createGeneralDraft'

interface GeneralDraftCreateVariables {
  payload: GeneralDraftPayload
  submit: boolean
}

export function useGeneralDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<GeneralDraftResult, unknown, GeneralDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createGeneralDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
