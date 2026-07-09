import { useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { getDraftDetail } from './getDraftDetail'

/**
 * 기안서 상세 조회 훅(`DRAFT_DETAIL`, ROADMAP(DRAFT) T2.2, F701).
 *
 * draftId가 아직 확정되지 않은 상태(라우트 파라미터 파싱 전·유효성 실패)에는 enabled:false로 훅
 * 호출을 지연해 undefined인 채로 요청이 나가는 것을 막는다(board useBoardDetailQuery 동형 가드).
 * queryFn은 enabled 가드로 draftId가 확정된 경우에만 실행되므로 number로 단언한다. draftId가 바뀌면
 * queryKey(approvalKeys.draftDetail)가 달라져 자동 재조회된다.
 *
 * board와 달리 DRAFT_DETAIL GET은 부작용이 없어 refetchOnWindowFocus 오버라이드는 두지 않는다
 * (전역 queryClient 정책을 그대로 따른다). 403/404 처리는 소비 컴포넌트가 apiError 매핑으로 담당한다.
 */
export function useDraftDetailQuery(draftId: number | undefined) {
  return useQuery({
    queryKey: approvalKeys.draftDetail(draftId),
    queryFn: () => getDraftDetail(draftId as number),
    enabled: draftId != null,
  })
}
