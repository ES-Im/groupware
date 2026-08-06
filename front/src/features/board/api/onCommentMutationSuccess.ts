import type { QueryClient } from '@tanstack/react-query'
import type { BoardDetailResponse } from '../model/board'
import { boardKeys } from '../model/queryKeys'

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
