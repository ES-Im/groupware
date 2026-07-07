import { useMutation, useQueryClient } from '@tanstack/react-query'
import { onCommentMutationSuccess } from './onCommentMutationSuccess'
import { registerComment } from './registerComment'
import type { CommentPayload } from '../model/board'

/** useCommentRegisterMutation 호출 변수. */
interface CommentRegisterVariables {
  boardId: number
  payload: CommentPayload
}

/**
 * 최상위 댓글 등록 mutation 훅(`COMMENT_REGISTER`, ROADMAP T14.1, F314).
 * 성공(201) 시 onCommentMutationSuccess 공유 헬퍼로 boardKeys.comments(boardId,*)를 invalidate하고,
 * commentCount는 +1 델타(docs/backend-contract/board-count-policy-for-frontend.md §5.3 실측 —
 * 댓글 등록은 +1)로 boardKeys.detail(boardId) 캐시를 로컬 갱신한다(상세 강제 재조회를 피해
 * viewCount 부작용을 방지). 실패 시 에러는 그대로 던져 호출부(T14.2)가 handleApiError(T0.2c)로
 * 위임하도록 둔다.
 */
export function useCommentRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, payload }: CommentRegisterVariables) =>
      registerComment(boardId, payload),
    onSuccess: (_data, { boardId }) => onCommentMutationSuccess(queryClient, boardId, 1),
  })
}
