import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMyPendingApprovalDrafts } from './getMyPendingApprovalDrafts'

/**
 * 결재대기함 목록 조회 훅(`MY_PENDING_APPROVAL_DRAFTS`, ROADMAP(DRAFT) T1.5, F710).
 * queryKey(approvalKeys.pending) + placeholderData 규약은 useMySubmittedDraftsQuery와 동일하다.
 */
export function useMyPendingApprovalDraftsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.pending(params),
    queryFn: () => getMyPendingApprovalDrafts(params),
    placeholderData: keepPreviousData,
  })
}
