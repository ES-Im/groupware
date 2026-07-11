import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseEducationApplicants } from './getFranchiseEducationApplicants'

/**
 * 교육 신청자 목록 조회 훅(`FRANCHISE_EDUCATION_APPLICANTS`, ROADMAP(FRANCHISE) T4.3).
 *
 * educationId가 확정되지 않은 상태에는 enabled:false로 지연한다(useFranchiseEducationDetailQuery와
 * 동일 가드 — 소비처는 상세 조회 성공 후에만 educationId를 넘겨 상세 404 시 신청자 요청이 중복
 * 실패하는 것을 막는다). params(page/size)는 queryKey에 그대로 포함되어 값이 바뀔 때마다
 * 재요청되고, placeholderData: keepPreviousData로 페이지 전환 시 이전 목록을 유지해 전면
 * "불러오는 중..." 깜빡임을 막는다(useFranchisesQuery 동형).
 */
export function useFranchiseEducationApplicantsQuery(
  educationId: number | undefined,
  params?: { page?: number; size?: number },
) {
  return useQuery({
    queryKey: franchiseKeys.education.applicants(educationId as number, params),
    queryFn: () => getFranchiseEducationApplicants(educationId as number, params),
    enabled: educationId != null,
    placeholderData: keepPreviousData,
  })
}
