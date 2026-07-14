import { apiClient } from '@/shared/api/client'

/**
 * 게시글 좋아요(`POST /api/boards/{boardId}/likes`, 201 Empty).
 *
 * path `boardId`만 사용하고 요청 본문은 없다. 좋아요 주체는 access token의 로그인 사용자다
 * (백엔드 `BoardLikeCommandApi.markLikeBoard` 실측). 이미 좋아요한 상태면 백엔드가
 * 400(`BOARD_006`, "이미 좋아요를 누른 게시글입니다")을 반환하지만, 호출부
 * (useBoardLikeMutation)가 현재 isLiked로 like/unlike를 분기하므로 정상 흐름에서는 발생하지 않는다.
 */
export async function likeBoard(boardId: number): Promise<void> {
  await apiClient.post(`/api/boards/${boardId}/likes`)
}
