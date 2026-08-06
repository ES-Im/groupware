import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMyUnsubmittedDrafts } from './getMyUnsubmittedDrafts'

export function useMyUnsubmittedDraftsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.unsubmitted(params),
    queryFn: () => getMyUnsubmittedDrafts(params),
    placeholderData: keepPreviousData,
  })
}
