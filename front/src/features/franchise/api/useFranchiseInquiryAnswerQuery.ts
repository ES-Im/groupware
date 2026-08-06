import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseInquiryAnswer } from './getFranchiseInquiryAnswer'

export function useFranchiseInquiryAnswerQuery(inquiryId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.inquiry.answer(inquiryId as number),
    queryFn: () => getFranchiseInquiryAnswer(inquiryId as number),
    enabled: inquiryId != null,
  })
}
