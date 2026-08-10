import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import { approvalKeys } from '../model/queryKeys'
import { createGeneralDraft, type GeneralDraftPayload } from './createGeneralDraft'

interface GeneralDraftCreateVariables {
  payload: GeneralDraftPayload
  submit: boolean
}

export function useGeneralDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<RegisterDomainIdResponse, unknown, GeneralDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createGeneralDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
