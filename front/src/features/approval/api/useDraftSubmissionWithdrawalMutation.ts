import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { withdrawDraftSubmission } from './withdrawDraftSubmission'

export function useDraftSubmissionWithdrawalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => withdrawDraftSubmission(draftId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
