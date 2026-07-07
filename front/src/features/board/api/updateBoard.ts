import { apiClient } from '@/shared/api/client'
import type { BoardUpdateRequest } from '../model/board'

/**
 * 게시글 수정(`BOARD_UPDATE`, api-endpoint.md 기능ID `BOARD_UPDATE` →
 * `PATCH /api/boards/{boardId}`, 권한=게시글 작성자).
 *
 * 요청 필드 categoryId/title/content는 전부 optional(변경 필드만 전송)이며 modifiedAt만
 * required(request-fields.adoc 실측 기준) — 호출부(useBoardUpdateMutation)가 편집 초기값·상세
 * 조회 시점의 modifiedAt을 그대로 되돌려 보내야 한다. 성공 시 `204 No Content`(응답 본문 없음).
 */
export async function updateBoard(boardId: number, payload: BoardUpdateRequest): Promise<void> {
  await apiClient.patch(`/api/boards/${boardId}`, payload)
}
