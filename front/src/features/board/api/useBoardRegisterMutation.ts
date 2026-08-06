import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { registerBoard } from './registerBoard'

export function useBoardRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerBoard,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...boardKeys.all, 'list'] }),
        queryClient.invalidateQueries({ queryKey: boardKeys.drafts() }),
      ])
    },
  })
}
