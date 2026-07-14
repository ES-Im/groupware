import { apiClient } from '@/shared/api/client'

/**
 * 게시글 좋아요 취소(`DELETE /api/boards/{boardId}/likes`, 204 Empty).
 *
 * path `boardId`만 사용하고 요청 본문은 없다. 좋아요하지 않은 상태에서 호출하면 백엔드가
 * 400(`BOARD_007`, "이미 좋아요를 취소하거나, 좋아요를 누르지 않은 게시글입니다")을 반환하지만,
 * 호출부(useBoardLikeMutation)가 현재 isLiked로 분기하므로 정상 흐름에서는 발생하지 않는다.
 */
export async function unlikeBoard(boardId: number): Promise<void> {
  await apiClient.delete(`/api/boards/${boardId}/likes`)
}
