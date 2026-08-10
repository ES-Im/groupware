import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { deleteDraft } from './deleteDraft'

export function useDraftDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => deleteDraft(draftId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
