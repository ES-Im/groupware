import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BoardDetailResponse } from '../model/board'
import { boardKeys } from '../model/queryKeys'
import { likeBoard } from './likeBoard'
import { unlikeBoard } from './unlikeBoard'

/**
 * 게시글 좋아요 토글 mutation 훅(`POST`/`DELETE /api/boards/{boardId}/likes`).
 *
 * `mutate`에 **현재 좋아요 여부**를 넘기면 그 반대 동작을 호출한다(true=이미 눌러 취소 →
 * unlike, false=신규 좋아요 → like). 초기 좋아요 여부는 BOARD_DETAIL 응답의 `isLiked`가 제공한다.
 *
 * **성공 후 상세를 invalidate(재조회)하지 않고 `setQueryData`로 캐시의 `isLiked`/`likeCount`만
 * 직접 갱신한다.** BOARD_DETAIL은 GET 재조회 시 서버가 `viewCount`를 증가시키는 부작용이 있어
 * (getBoardDetail/useBoardDetailQuery 주석), 좋아요 토글마다 refetch하면 사용자의 실제 재열람
 * 없이 조회수가 오른다. 좋아요 토글은 `likeCount` ±1·`isLiked` 반전만 필요하므로 낙관적 값이
 * 정확하다(단건 토글). 서버 likeCount(Redis 델타 기반)와의 미세한 동시성 차이는 다음 상세
 * 진입 시 재조회로 정정된다.
 */
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
