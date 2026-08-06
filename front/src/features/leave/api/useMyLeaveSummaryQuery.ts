import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getMyLeaveSummary } from './getMyLeaveSummary'

export function useMyLeaveSummaryQuery(year?: number) {
  return useQuery({
    queryKey: leaveKeys.mySummary(year),
    queryFn: () => getMyLeaveSummary({ year }),
    placeholderData: keepPreviousData,
  })
}
