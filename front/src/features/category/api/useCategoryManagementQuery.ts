import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { getCategoryManagement } from './getCategoryManagement'

export function useCategoryManagementQuery(params?: {
  keyword?: string
  isVisible?: boolean
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: categoryKeys.management(params),
    queryFn: () => getCategoryManagement(params),
    placeholderData: keepPreviousData,
  })
}
