import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { ApproverParam } from '../model/approverParam'
import { submitDraft } from './submitDraft'

interface DraftSubmitVariables {
  draftId: number
  approvers?: ApproverParam[]
}

export function useDraftSubmitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, approvers }: DraftSubmitVariables) => submitDraft(draftId, approvers),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
