import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardEditMode } from './getBoardEditMode'

/**
 * 게시글 편집 초기값 조회 훅(ROADMAP T13.1, F307).
 *
 * boardId가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전)에는 enabled:false로 훅 호출을
 * 지연해 boardId undefined인 채로 요청이 나가는 것을 막는다(useBoardDetailQuery/useBoardFilesQuery와
 * 동일 가드 패턴). queryFn은 enabled 가드로 인해 boardId가 확정된 경우에만 실행되므로 number로
 * 단언한다.
 *
 * boardId가 바뀌면 queryKey(boardKeys.editMode(boardId))가 달라져 자동으로 재조회된다.
 */
export function useBoardEditModeQuery(boardId: number | undefined) {
  return useQuery({
    queryKey: boardKeys.editMode(boardId),
    queryFn: () => getBoardEditMode(boardId as number),
    enabled: boardId != null,
  })
}
