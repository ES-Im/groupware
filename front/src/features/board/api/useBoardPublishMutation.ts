import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { publishBoard } from './publishBoard'

/**
 * 임시저장 게시글 발행 mutation 훅(`BOARD_PUBLISH`, ROADMAP T11.4, F306).
 *
 * 게시글 상세 페이지(T11.3)의 "발행" 버튼이 소비하며, M15(내 임시저장함)도 이 훅을 그대로
 * import해 재사용할 수 있도록 독립 파일로 분리했다(중복 생성 금지 — ROADMAP T11.4 명시).
 * 이 훅 자체는 `boardKeys.detail(boardId)` invalidate만 책임진다. 소비처별로 필요한 성공
 * 토스트나 추가 invalidate(예: M15가 목록·임시저장함 캐시까지 넓게 갱신하려는 경우)는
 * `mutate(boardId, { onSuccess, onError })` 호출 시점에 얹는다
 * (activateDepartment/useActivateDepartmentMutation과 동일한 분리 패턴).
 */
export function useBoardPublishMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (boardId: number) => publishBoard(boardId),
    onSuccess: async (_data, boardId) => {
      await queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
    },
  })
}
