import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardFiles } from './getBoardFiles'

/**
 * 게시글 첨부파일 목록 조회 훅(ROADMAP T11.1, F304).
 *
 * boardId가 아직 확정되지 않은 상태에는 enabled:false로 훅 호출을 지연한다(useBoardDetailQuery와
 * 동일 가드 패턴). queryFn은 enabled 가드로 인해 boardId가 확정된 경우에만 실행되므로 number로
 * 단언한다.
 *
 * boardId가 바뀌면 queryKey(boardKeys.files(boardId))가 달라져 자동으로 재조회된다.
 */
export function useBoardFilesQuery(boardId: number | undefined) {
  return useQuery({
    queryKey: boardKeys.files(boardId),
    queryFn: () => getBoardFiles(boardId as number),
    enabled: boardId != null,
  })
}
