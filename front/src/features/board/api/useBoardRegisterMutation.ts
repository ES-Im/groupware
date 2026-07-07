import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { registerBoard } from './registerBoard'

/**
 * 게시글 등록 mutation 훅(`BOARD_REGISTER`, ROADMAP T12.1, F305).
 * `publishedAt` 포함 여부로 즉시발행/임시저장이 분기되며, 두 경우 모두 `201 Empty`로 성공 처리한다
 * (registerBoard는 boardId를 반환하지 않는다 — PRD §해결됨에 따라 등록 직후 상세 자동 이동은
 * 하지 않는다. 호출부는 성공 후 목록/임시저장함으로 이동하거나 "임시저장글 불러오기"로 이어간다).
 *
 * 성공 시 신규 글이 어느 카테고리·검색조건의 캐시 목록에 들어갈지 알 수 없으므로
 * `[...boardKeys.all, 'list']` 접두(prefix)로 모든 categoryId/params 조합의 목록 쿼리를
 * 한 번에 invalidate하고(boardKeys.list(categoryId, params)가 만드는 키와 접두 일치),
 * boardKeys.drafts()도 함께 invalidate해 임시저장 시 임시저장함이 최신 상태로 반영되게 한다.
 * 실패 시 에러는 그대로 던져 호출부(T12.2)가 handleApiError로 위임하도록 둔다.
 */
export function useBoardRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerBoard,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...boardKeys.all, 'list'] }),
        queryClient.invalidateQueries({ queryKey: boardKeys.drafts() }),
      ])
    },
  })
}
