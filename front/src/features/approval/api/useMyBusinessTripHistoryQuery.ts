import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { MyBusinessTripHistoryParams } from '../model/businessTripHistory'
import { getMyBusinessTripHistory } from './getMyBusinessTripHistory'

export function useMyBusinessTripHistoryQuery(params?: MyBusinessTripHistoryParams) {
  return useQuery({
    queryKey: approvalKeys.myBusinessTripHistory(params),
    queryFn: () => getMyBusinessTripHistory(params),
    placeholderData: keepPreviousData,
  })
}
