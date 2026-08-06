import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getEmpLeaveSummary } from './getEmpLeaveSummary'

export function useEmpLeaveSummaryQuery(params?: {
  keyword?: string
  deptId?: number
  year?: number
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: leaveKeys.empSummary(params),
    queryFn: () => getEmpLeaveSummary(params),
    placeholderData: keepPreviousData,
  })
}
