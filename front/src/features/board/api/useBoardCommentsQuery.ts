import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardComments } from './getBoardComments'

/**
 * 게시글 댓글 목록 조회 훅(ROADMAP T14.1, F313).
 *
 * boardId가 아직 확정되지 않은 상태(예: BOARD_DETAIL 로딩 중)에는 enabled:false로 훅 호출을
 * 지연해 boardId undefined인 채로 요청이 나가는 것을 막는다(useBoardListQuery/
 * useBoardDetailQuery와 동일 가드 패턴). queryFn은 enabled 가드로 인해 boardId가 확정된 경우에만
 * 실행되므로 number로 단언한다.
 *
 * page/size는 queryKey(boardKeys.comments)에 그대로 포함되어 값이 바뀔 때마다 재요청된다.
 * placeholderData: keepPreviousData(useBoardListQuery와 동일 패턴)로 페이지 이동 시 새 응답이
 * 도착하기 전까지 이전 목록을 유지해 화면이 매번 "불러오는 중..."으로 전면 교체되는 것을 막는다.
 */
export function useBoardCommentsQuery(
  boardId: number | undefined,
  params?: { page?: number; size?: number },
) {
  return useQuery({
    queryKey: boardKeys.comments(boardId, params),
    queryFn: () => getBoardComments(boardId as number, params),
    enabled: boardId != null,
    placeholderData: keepPreviousData,
  })
}
