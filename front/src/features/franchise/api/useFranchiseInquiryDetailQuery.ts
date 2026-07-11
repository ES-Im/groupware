import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseInquiryDetail } from './getFranchiseInquiryDetail'

/**
 * 가맹점 문의 상세 조회 훅(`FRANCHISE_INQUIRY_DETAIL`, ROADMAP(FRANCHISE) T5.2).
 *
 * inquiryId가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전/무효)에는 enabled:false로
 * 훅 호출을 지연한다(useFranchiseDetailQuery와 동일 가드 패턴). queryFn은 enabled 가드로
 * 인해 inquiryId가 확정된 경우에만 실행되므로 number로 단언한다.
 */
export function useFranchiseInquiryDetailQuery(inquiryId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.inquiry.detail(inquiryId as number),
    queryFn: () => getFranchiseInquiryDetail(inquiryId as number),
    enabled: inquiryId != null,
  })
}
