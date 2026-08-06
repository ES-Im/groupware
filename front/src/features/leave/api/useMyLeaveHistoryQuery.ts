import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import type { MyLeaveHistoryParams } from '../model/myLeave'
import { getMyLeaveHistory } from './getMyLeaveHistory'

export function useMyLeaveHistoryQuery(params?: MyLeaveHistoryParams) {
  return useQuery({
    queryKey: leaveKeys.myHistory(params),
    queryFn: () => getMyLeaveHistory(params),
    placeholderData: keepPreviousData,
  })
}
