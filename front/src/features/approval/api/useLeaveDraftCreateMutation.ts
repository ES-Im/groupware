import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import { approvalKeys } from '../model/queryKeys'
import { createLeaveDraft, type LeaveDraftPayload } from './createLeaveDraft'

interface LeaveDraftCreateVariables {
  payload: LeaveDraftPayload
  submit: boolean
}

export function useLeaveDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<RegisterDomainIdResponse, unknown, LeaveDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createLeaveDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
