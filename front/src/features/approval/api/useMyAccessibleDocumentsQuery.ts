import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMyAccessibleDocuments } from './getMyAccessibleDocuments'

export function useMyAccessibleDocumentsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.accessible(params),
    queryFn: () => getMyAccessibleDocuments(params),
    placeholderData: keepPreviousData,
  })
}
