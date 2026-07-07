import { useMutation, useQueryClient } from '@tanstack/react-query'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'
import { replyComment } from './replyComment'
import type { CommentPayload } from '../model/board'

/** useCommentReplyMutation 호출 변수. */
interface CommentReplyVariables {
  boardId: number
  parentCommentId: number
  payload: CommentPayload
}

/**
 * 1-depth 대댓글 등록 mutation 훅(`COMMENT_REPLY`, ROADMAP T14.1, F315).
 * 성공(201) 시 onCommentMutationSuccess 공유 헬퍼로 boardKeys.comments(boardId,*)를 invalidate하고,
 * commentCount는 +1 델타(docs/backend-contract/board-count-policy-for-frontend.md §5.3 실측 —
 * 대댓글 등록도 +1)로 boardKeys.detail(boardId) 캐시를 로컬 갱신한다(상세 강제 재조회를 피해
 * viewCount 부작용을 방지). 실패 시 에러는 그대로 던져 호출부(T14.2)가 handleApiError(T0.2c)로
 * 위임하도록 둔다.
 */
export function useCommentReplyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, parentCommentId, payload }: CommentReplyVariables) =>
      replyComment(boardId, parentCommentId, payload),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, 1),
  })
}
