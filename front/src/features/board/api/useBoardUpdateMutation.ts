import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { updateBoard } from './updateBoard'
import type { BoardUpdateRequest } from '../model/board'

interface UpdateBoardVariables {
  boardId: number
  payload: BoardUpdateRequest
}

export function useBoardUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, payload }: UpdateBoardVariables) => updateBoard(boardId, payload),
    onSuccess: async (_data, { boardId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
        queryClient.invalidateQueries({ queryKey: boardKeys.drafts() }),
      ])
    },
  })
}
