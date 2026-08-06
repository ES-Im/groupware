import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approvalKeys } from '../model/queryKeys'
import { rejectDraft } from './rejectDraft'

interface RejectDraftVariables {
  draftId: number
  reason: string
}

export function useRejectDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, RejectDraftVariables>({
    mutationFn: ({ draftId, reason }) => rejectDraft(draftId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('기안서를 반려했습니다')
    },
  })
}
