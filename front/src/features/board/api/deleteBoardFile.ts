import { apiClient } from '@/shared/api/client'

/**
 * 게시글 첨부파일 삭제(`BOARD_FILE_DELETE`, api-endpoint.md 기능ID `BOARD_FILE_DELETE` →
 * `DELETE /api/boards/{boardId}/files/{fileId}`, 게시글 작성자 또는 ADMIN).
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부(`useBoardFileDeleteMutation`)가
 * `boardKeys.files(boardId)`를 invalidate해 첨부 목록을 재조회한다.
 */
export async function deleteBoardFile(boardId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/boards/${boardId}/files/${fileId}`)
}
