import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { readCirculation } from './readCirculation'

export function useCirculationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => readCirculation(draftId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('공람을 읽음 처리했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
