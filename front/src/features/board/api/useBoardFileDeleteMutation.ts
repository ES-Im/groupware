import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { deleteBoardFile } from './deleteBoardFile'

/** useBoardFileDeleteMutation 호출 변수. */
interface BoardFileDeleteVariables {
  boardId: number
  fileId: number
}

/**
 * 게시글 첨부파일 삭제 mutation 훅(`BOARD_FILE_DELETE`, ROADMAP T13.2).
 * 성공(204) 시 onSuccess에서 `boardKeys.files(boardId)`를 invalidate해 `useBoardFilesQuery`
 * (T11.1)가 최신 첨부 목록으로 재조회되도록 한다. 실패 시 에러는 그대로 던져 호출부(T13.3)가
 * `handleApiError`(T0.2c)로 위임하도록 둔다.
 */
export function useBoardFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, fileId }: BoardFileDeleteVariables) => deleteBoardFile(boardId, fileId),
    onSuccess: async (_data, { boardId }) => {
      await queryClient.invalidateQueries({ queryKey: boardKeys.files(boardId) })
    },
  })
}
