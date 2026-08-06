import { useMutation, useQueryClient } from '@tanstack/react-query'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'
import { updateComment } from './updateComment'
import type { CommentPayload } from '../model/board'

interface CommentUpdateVariables {
  boardId: number
  commentId: number
  payload: CommentPayload
}

export function useCommentUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, commentId, payload }: CommentUpdateVariables) =>
      updateComment(boardId, commentId, payload),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, 0),
  })
}
