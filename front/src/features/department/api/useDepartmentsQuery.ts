import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartments } from './getDepartments'

export function useDepartmentsQuery(
  params?: {
    keyword?: string
    isActive?: boolean
    page?: number
    size?: number
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => getDepartments(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}
