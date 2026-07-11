import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseInquiryAnswer } from './getFranchiseInquiryAnswer'

/**
 * 가맹점 문의 답변 조회 훅(`FRANCHISE_INQUIRY_ANSWER_DETAIL`, ROADMAP(FRANCHISE) T5.2).
 *
 * inquiryId가 아직 확정되지 않은 상태에는 enabled:false로 훅 호출을 지연한다
 * (useFranchiseInquiryDetailQuery와 동일 가드 패턴). 미작성 답변(404)은 queryClient의 전역
 * 방침(shared/api/queryClient.ts)이 이미 재시도 대상에서 제외하므로 여기서 별도 retry 설정은 하지 않는다.
 */
export function useFranchiseInquiryAnswerQuery(inquiryId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.inquiry.answer(inquiryId as number),
    queryFn: () => getFranchiseInquiryAnswer(inquiryId as number),
    enabled: inquiryId != null,
  })
}
