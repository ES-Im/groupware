import { useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { getMyPendingApprovalDraftsCount } from './getMyPendingApprovalDraftsCount'

export function useMyPendingApprovalDraftsCountQuery() {
  return useQuery({
    queryKey: approvalKeys.pendingCount(),
    queryFn: getMyPendingApprovalDraftsCount,
  })
}
