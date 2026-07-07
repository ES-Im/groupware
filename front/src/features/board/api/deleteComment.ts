import { apiClient } from '@/shared/api/client'

/**
 * 본인 댓글 삭제(`COMMENT_DELETE`, api-endpoint.md 기능ID `COMMENT_DELETE` →
 * `DELETE /api/boards/{boardId}/comments/{commentId}`, 권한=댓글 작성자).
 * 요청 본문 없음(request-body.adoc 실측). 성공 시 `204 No Content`(응답 본문 없음).
 * **소프트 삭제**(PRD F317) — 서버가 물리 삭제 대신 isDeleted=true로 전환하고 writerEmpId/
 * writerEmpName/content/registerAt/isEdited를 null로 되돌린다(BoardCommentResponse 실측,
 * model/board.ts의 BoardComment 타입 참고). 이 함수 자체는 응답 본문이 없어 별도 반영이 필요
 * 없고, 호출부가 목록/상세를 재조회해 최신 상태를 받는다.
 */
export async function deleteComment(boardId: number, commentId: number): Promise<void> {
  await apiClient.delete(`/api/boards/${boardId}/comments/${commentId}`)
}
