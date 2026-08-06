import { useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { getMyDocumentBoxSummary } from './getMyDocumentBoxSummary'

export function useMyDocumentBoxSummaryQuery() {
  return useQuery({
    queryKey: approvalKeys.summary(),
    queryFn: getMyDocumentBoxSummary,
  })
}
