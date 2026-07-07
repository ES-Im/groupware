import type { QueryClient } from '@tanstack/react-query'
import type { BoardDetailResponse } from '../model/board'
import { boardKeys } from '../model/queryKeys'

/**
 * 댓글 mutation 4종(등록/대댓글/수정/삭제, ROADMAP T14.1 F314~F317) 공용 성공 후처리.
 *
 * boardId의 모든 page/size 조합 댓글 목록 캐시를 접두(prefix) 매칭으로 한 번에 invalidate한다
 * (`[...boardKeys.all, 'comments', boardId]`는 `boardKeys.comments(boardId, params)`가 만드는
 * 키의 앞부분과 정확히 일치 — useBoardRegisterMutation이 `[...boardKeys.all, 'list']` 접두로
 * 모든 categoryId/params 조합을 한 번에 invalidate하는 것과 동일 패턴, 재설계 아님).
 *
 * `boardKeys.detail(boardId)`는 **invalidateQueries(강제 재조회)하지 않는다** —
 * `BOARD_DETAIL`(GET)은 호출마다 서버가 viewCount를 +1 하는 부작용이 있어(§docs/backend-contract/
 * board-count-policy-for-frontend.md §4.2/§5.1), 댓글 조작 시마다 상세를 재조회하면 조회수가
 * 의도치 않게 증가한다. 대신 `commentCountDelta`(§동일 문서 §5.3 실측: 등록 +1·대댓글 +1·
 * 삭제 -1·수정 0)만큼 `setQueryData`로 캐시된 commentCount를 로컬에서 직접 증감한다 — 네트워크
 * 재조회 없이 정확한 값을 반영하며, delta가 0(수정)이면 아무 것도 하지 않는다. 캐시에 아직 상세가
 * 없으면(old undefined) no-op — 다음 실제 상세 진입 시 서버 값을 그대로 신뢰한다.
 */
export async function onCommentMutationSuccess(
  queryClient: QueryClient,
  boardId: number,
  commentCountDelta: number,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: [...boardKeys.all, 'comments', boardId] })
  if (commentCountDelta !== 0) {
    queryClient.setQueryData<BoardDetailResponse>(boardKeys.detail(boardId), (old) =>
      old ? { ...old, commentCount: old.commentCount + commentCountDelta } : old,
    )
  }
}
