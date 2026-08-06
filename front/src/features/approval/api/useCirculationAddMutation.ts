import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { addCirculation } from './addCirculation'

export function useCirculationAddMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, empIds }: { draftId: number; empIds: number[] }) =>
      addCirculation(draftId, empIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('공람자를 추가했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
