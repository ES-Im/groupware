import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { deleteBoard } from './deleteBoard'

export function useBoardDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (boardId: number) => deleteBoard(boardId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}
