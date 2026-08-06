import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { deleteBoardFile } from './deleteBoardFile'

interface BoardFileDeleteVariables {
  boardId: number
  fileId: number
}

export function useBoardFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, fileId }: BoardFileDeleteVariables) => deleteBoardFile(boardId, fileId),
    onSuccess: async (_data, { boardId }) => {
      await queryClient.invalidateQueries({ queryKey: boardKeys.files(boardId) })
    },
  })
}
