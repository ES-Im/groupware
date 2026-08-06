import { useQuery } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { getCategories } from './getCategories'

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: getCategories,
  })
}
