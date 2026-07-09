import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMyAccessibleDocuments } from './getMyAccessibleDocuments'

/**
 * 결재함 목록 조회 훅(`MY_ACCESSIBLE_DOCUMENTS`, ROADMAP(DRAFT) T1.5, F714).
 * queryKey(approvalKeys.accessible) + placeholderData 규약은 useMySubmittedDraftsQuery와 동일하다.
 */
export function useMyAccessibleDocumentsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.accessible(params),
    queryFn: () => getMyAccessibleDocuments(params),
    placeholderData: keepPreviousData,
  })
}
