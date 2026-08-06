import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardComments } from './getBoardComments'

export function useBoardCommentsQuery(
  boardId: number | undefined,
  params?: { page?: number; size?: number },
) {
  return useQuery({
    queryKey: boardKeys.comments(boardId, params),
    queryFn: () => getBoardComments(boardId as number, params),
    enabled: boardId != null,
    placeholderData: keepPreviousData,
  })
}
