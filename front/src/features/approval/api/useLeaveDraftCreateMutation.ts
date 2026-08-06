import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  createLeaveDraft,
  type LeaveDraftPayload,
  type LeaveDraftResult,
} from './createLeaveDraft'

interface LeaveDraftCreateVariables {
  payload: LeaveDraftPayload
  submit: boolean
}

export function useLeaveDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<LeaveDraftResult, unknown, LeaveDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createLeaveDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
