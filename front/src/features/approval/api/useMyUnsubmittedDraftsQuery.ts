import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMyUnsubmittedDrafts } from './getMyUnsubmittedDrafts'

/**
 * 임시저장함 목록 조회 훅(`MY_UNSUBMITTED_DRAFTS`, ROADMAP(DRAFT) T1.5, F713).
 * queryKey(approvalKeys.unsubmitted) + placeholderData 규약은 useMySubmittedDraftsQuery와 동일하다.
 */
export function useMyUnsubmittedDraftsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.unsubmitted(params),
    queryFn: () => getMyUnsubmittedDrafts(params),
    placeholderData: keepPreviousData,
  })
}
