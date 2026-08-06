import { useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { getDraftDetail } from './getDraftDetail'

export function useDraftDetailQuery(draftId: number | undefined) {
  return useQuery({
    queryKey: approvalKeys.draftDetail(draftId),
    queryFn: () => getDraftDetail(draftId as number),
    enabled: draftId != null,
  })
}
