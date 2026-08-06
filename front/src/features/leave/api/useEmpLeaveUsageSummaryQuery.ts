import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getEmpLeaveUsageSummary } from './getEmpLeaveUsageSummary'

export function useEmpLeaveUsageSummaryQuery(params?: { deptId?: number; year?: number }) {
  return useQuery({
    queryKey: leaveKeys.empUsageSummary(params),
    queryFn: () => getEmpLeaveUsageSummary(params),
    placeholderData: keepPreviousData,
  })
}
