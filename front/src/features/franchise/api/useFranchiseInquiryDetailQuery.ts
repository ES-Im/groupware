import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseInquiryDetail } from './getFranchiseInquiryDetail'

export function useFranchiseInquiryDetailQuery(inquiryId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.inquiry.detail(inquiryId as number),
    queryFn: () => getFranchiseInquiryDetail(inquiryId as number),
    enabled: inquiryId != null,
  })
}
