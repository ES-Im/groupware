import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardList } from './getBoardList'

export function useBoardListQuery(
  categoryId: number | undefined,
  params?: { keyword?: string; page?: number; size?: number },
) {
  return useQuery({
    queryKey: boardKeys.list(categoryId, params),
    queryFn: () => getBoardList(categoryId as number, params),
    enabled: categoryId != null,
    placeholderData: keepPreviousData,
  })
}
