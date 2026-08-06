import { useMutation, useQueryClient } from '@tanstack/react-query'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'
import { registerComment } from './registerComment'
import type { CommentPayload } from '../model/board'

interface CommentRegisterVariables {
  boardId: number
  payload: CommentPayload
}

export function useCommentRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, payload }: CommentRegisterVariables) =>
      registerComment(boardId, payload),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, 1),
  })
}
