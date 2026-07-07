import { useMutation, useQueryClient } from '@tanstack/react-query'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'
import { updateComment } from './updateComment'
import type { CommentPayload } from '../model/board'

/** useCommentUpdateMutation 호출 변수. */
interface CommentUpdateVariables {
  boardId: number
  commentId: number
  payload: CommentPayload
}

/**
 * 본인 댓글 수정 mutation 훅(`COMMENT_UPDATE`, ROADMAP T14.1, F316).
 * 성공(204) 시 onCommentMutationSuccess 공유 헬퍼로 boardKeys.comments(boardId,*)를
 * invalidate해 isEdited 반영을 재조회로 확인한다. commentCount 델타는 0(docs/backend-contract/
 * board-count-policy-for-frontend.md §5.3 실측 — 댓글 수정은 count 변화 없음)이므로 헬퍼가
 * boardKeys.detail(boardId) 캐시를 건드리지 않는다(no-op). 실패 시 에러는 그대로 던져
 * 호출부(T14.2)가 handleApiError(T0.2c)로 위임하도록 둔다.
 */
export function useCommentUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, commentId, payload }: CommentUpdateVariables) =>
      updateComment(boardId, commentId, payload),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, 0),
  })
}
