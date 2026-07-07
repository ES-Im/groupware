import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteComment } from './deleteComment'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'

/** useCommentDeleteMutation 호출 변수. */
interface CommentDeleteVariables {
  boardId: number
  commentId: number
}

/**
 * 본인 댓글 삭제(소프트) mutation 훅(`COMMENT_DELETE`, ROADMAP T14.1, F317).
 * 성공(204) 시 onCommentMutationSuccess 공유 헬퍼로 boardKeys.comments(boardId,*)를 invalidate하고,
 * commentCount는 -1 델타(docs/backend-contract/board-count-policy-for-frontend.md §5.3 실측 —
 * 댓글 삭제는 -1)로 boardKeys.detail(boardId) 캐시를 로컬 갱신한다(상세 강제 재조회를 피해
 * viewCount 부작용을 방지). 실패 시 에러는 그대로 던져 호출부(T14.2)가 handleApiError(T0.2c)로
 * 위임하도록 둔다.
 */
export function useCommentDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, commentId }: CommentDeleteVariables) =>
      deleteComment(boardId, commentId),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, -1),
  })
}
