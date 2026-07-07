import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardDetail } from './getBoardDetail'

/**
 * 게시글 상세 조회 훅(ROADMAP T11.1, F303).
 *
 * boardId가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전)에는 enabled:false로 훅 호출을
 * 지연해 boardId undefined인 채로 요청이 나가는 것을 막는다(department 도메인
 * useDepartmentInfoQuery와 동일 가드 패턴). queryFn은 enabled 가드로 인해 boardId가 확정된
 * 경우에만 실행되므로 number로 단언한다.
 *
 * boardId가 바뀌면 queryKey(boardKeys.detail(boardId))가 달라져 자동으로 재조회된다.
 *
 * BOARD_DETAIL은 GET이지만 호출마다 서버가 viewCount를 증가시키는 부작용이 있다. 전역
 * queryClient(staleTime: 0)를 그대로 따르면 창 포커스 복귀만으로도 TanStack Query 기본값
 * (refetchOnWindowFocus: true)에 의해 자동 재조회가 발생해, 사용자의 실제 재열람 없이도
 * 조회수가 중복 증가한다(code-reviewer 지적, 사용자 확정 결정). 이를 막기 위해 이 훅에 한해
 * refetchOnWindowFocus: false로 오버라이드한다(다른 쿼리의 전역 정책에는 영향 없음).
 */
export function useBoardDetailQuery(boardId: number | undefined) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => getBoardDetail(boardId as number),
    enabled: boardId != null,
    refetchOnWindowFocus: false,
  })
}
