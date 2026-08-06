import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardEditMode } from './getBoardEditMode'

export function useBoardEditModeQuery(boardId: number | undefined) {
  return useQuery({
    queryKey: boardKeys.editMode(boardId),
    queryFn: () => getBoardEditMode(boardId as number),
    enabled: boardId != null,
  })
}
