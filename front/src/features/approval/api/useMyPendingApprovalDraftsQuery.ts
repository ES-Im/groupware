import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMyPendingApprovalDrafts } from './getMyPendingApprovalDrafts'

export function useMyPendingApprovalDraftsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.pending(params),
    queryFn: () => getMyPendingApprovalDrafts(params),
    placeholderData: keepPreviousData,
  })
}
