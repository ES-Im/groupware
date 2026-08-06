import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteComment } from './deleteComment'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'

interface CommentDeleteVariables {
  boardId: number
  commentId: number
}

export function useCommentDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, commentId }: CommentDeleteVariables) =>
      deleteComment(boardId, commentId),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, -1),
  })
}
