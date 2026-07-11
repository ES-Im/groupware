import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseDetail } from './getFranchiseDetail'

/**
 * 가맹점 상세 조회 훅(`FRANCHISE_DETAIL`, ROADMAP(FRANCHISE) T2.3).
 *
 * franchiseId가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전/무효)에는 enabled:false로
 * 훅 호출을 지연한다(useMeetingRoomDetailQuery와 동일 가드 패턴). queryFn은 enabled 가드로
 * 인해 franchiseId가 확정된 경우에만 실행되므로 number로 단언한다.
 */
export function useFranchiseDetailQuery(franchiseId: number | undefined) {
  return useQuery({
    queryKey: franchiseKeys.detail(franchiseId as number),
    queryFn: () => getFranchiseDetail(franchiseId as number),
    enabled: franchiseId != null,
  })
}
