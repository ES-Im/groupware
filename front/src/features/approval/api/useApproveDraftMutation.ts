import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { approveDraft } from './approveDraft'

export function useApproveDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => approveDraft(draftId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('기안서를 승인했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
