import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardFiles } from './getBoardFiles'

export function useBoardFilesQuery(boardId: number | undefined) {
  return useQuery({
    queryKey: boardKeys.files(boardId),
    queryFn: () => getBoardFiles(boardId as number),
    enabled: boardId != null,
  })
}
