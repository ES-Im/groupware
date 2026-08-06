import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardDetail } from './getBoardDetail'

export function useBoardDetailQuery(boardId: number | undefined) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => getBoardDetail(boardId as number),
    enabled: boardId != null,
    refetchOnWindowFocus: false,
  })
}
