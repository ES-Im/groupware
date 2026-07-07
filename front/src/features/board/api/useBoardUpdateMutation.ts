import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { updateBoard } from './updateBoard'
import type { BoardUpdateRequest } from '../model/board'

/** useBoardUpdateMutation 호출 변수. */
interface UpdateBoardVariables {
  boardId: number
  payload: BoardUpdateRequest
}

/**
 * 게시글 수정 mutation 훅(`BOARD_UPDATE`, ROADMAP T13.1, F307).
 * 성공(204) 시 onSuccess에서 boardKeys.detail(boardId)를 invalidate해 useBoardDetailQuery(T11.1)가
 * 변경된 내용으로 재조회되도록 한다(department 도메인의 useActivateDepartmentMutation 등과 동일
 * invalidate 패턴). 실패 시 에러는 그대로 던져 호출부(T13.3)가 handleApiError(T0.2c)로
 * 위임하도록 둔다.
 */
export function useBoardUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, payload }: UpdateBoardVariables) => updateBoard(boardId, payload),
    onSuccess: async (_data, { boardId }) => {
      await queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
    },
  })
}
