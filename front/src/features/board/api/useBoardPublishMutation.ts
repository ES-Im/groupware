import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { publishBoard } from './publishBoard'

export function useBoardPublishMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (boardId: number) => publishBoard(boardId),
    onSuccess: async (_data, boardId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
        queryClient.invalidateQueries({ queryKey: [...boardKeys.all, 'list'] }),
        queryClient.invalidateQueries({ queryKey: boardKeys.drafts() }),
      ])
    },
  })
}
