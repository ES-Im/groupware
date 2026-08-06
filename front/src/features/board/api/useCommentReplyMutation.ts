import { useMutation, useQueryClient } from '@tanstack/react-query'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'
import { replyComment } from './replyComment'
import type { CommentPayload } from '../model/board'

interface CommentReplyVariables {
  boardId: number
  parentCommentId: number
  payload: CommentPayload
}

export function useCommentReplyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, parentCommentId, payload }: CommentReplyVariables) =>
      replyComment(boardId, parentCommentId, payload),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, 1),
  })
}
