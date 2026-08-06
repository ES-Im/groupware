import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { removeCirculation } from './removeCirculation'

export function useCirculationRemoveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, empId }: { draftId: number; empId: number }) =>
      removeCirculation(draftId, empId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('공람자를 제거했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
