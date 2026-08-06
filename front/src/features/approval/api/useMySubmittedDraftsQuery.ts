import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMySubmittedDrafts } from './getMySubmittedDrafts'

export function useMySubmittedDraftsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.submitted(params),
    queryFn: () => getMySubmittedDrafts(params),
    placeholderData: keepPreviousData,
  })
}
