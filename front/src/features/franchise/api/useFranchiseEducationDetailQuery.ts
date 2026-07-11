import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseEducationDetail } from './getFranchiseEducationDetail'

/**
 * 교육 상세 조회 훅(`FRANCHISE_EDUCATION_DETAIL`, ROADMAP(FRANCHISE) T4.3).
 *
 * educationId가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전/무효)에는 enabled:false로
 * 훅 호출을 지연한다(useFranchiseDetailQuery와 동일 가드 패턴). queryFn은 enabled 가드로
 * 인해 educationId가 확정된 경우에만 실행되므로 number로 단언한다.
 */
export function useFranchiseEducationDetailQuery(educationId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.education.detail(educationId as number),
    queryFn: () => getFranchiseEducationDetail(educationId as number),
    enabled: educationId != null,
  })
}
