import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardDrafts } from './getBoardDrafts'

export function useBoardDraftsQuery() {
  return useQuery({
    queryKey: boardKeys.drafts(),
    queryFn: getBoardDrafts,
  })
}
