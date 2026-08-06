import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BoardDetailResponse } from '../model/board'
import { boardKeys } from '../model/queryKeys'
import { likeBoard } from './likeBoard'
import { unlikeBoard } from './unlikeBoard'

export function useBoardLikeMutation(boardId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (currentlyLiked: boolean) =>
      currentlyLiked ? unlikeBoard(boardId) : likeBoard(boardId),
    onSuccess: (_data, currentlyLiked) => {
      queryClient.setQueryData<BoardDetailResponse>(boardKeys.detail(boardId), (old) =>
        old
          ? {
              ...old,
              isLiked: !currentlyLiked,
              likeCount: old.likeCount + (currentlyLiked ? -1 : 1),
            }
          : old,
      )
    },
  })
}
