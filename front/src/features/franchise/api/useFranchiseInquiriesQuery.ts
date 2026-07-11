import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseInquiries } from './getFranchiseInquiries'

/**
 * 문의 목록 조회 훅(`FRANCHISE_INQUIRY_LIST`, ROADMAP(FRANCHISE) T5.1).
 * params(isAnswered/assignedManagerId/keyword/from/to/page/size)는 queryKey에 그대로 포함되어
 * 값이 바뀔 때마다 재요청된다(franchiseKeys.inquiry.list, T1.1-c 키 소비).
 *
 * placeholderData: keepPreviousData로 필터/페이지 전환 시 새 응답이 도착하기 전까지 이전
 * 목록을 유지해 화면이 매번 "불러오는 중..."으로 전면 교체되는 깜빡임을 막는다
 * (useFranchisesQuery 동형).
 */
export function useFranchiseInquiriesQuery(params?: {
  isAnswered?: boolean
  assignedManagerId?: number
  keyword?: string
  from?: string
  to?: string
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: franchiseKeys.inquiry.list(params),
    queryFn: () => getFranchiseInquiries(params),
    placeholderData: keepPreviousData,
  })
}
