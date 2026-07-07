import { apiClient } from '@/shared/api/client'
import type { CommentPayload } from '../model/board'

/**
 * 본인 댓글 수정(`COMMENT_UPDATE`, api-endpoint.md 기능ID `COMMENT_UPDATE` →
 * `PATCH /api/boards/{boardId}/comments/{commentId}`, 권한=댓글 작성자).
 * 요청 필드는 content 단일(300자 이하·공백 불가, request-fields.adoc 실측 — COMMENT_REGISTER와
 * 완전히 동일). 성공 시 `204 No Content`(응답 본문 없음) — 서버가 isEdited를 true로 반영한다.
 */
export async function updateComment(
  boardId: number,
  commentId: number,
  payload: CommentPayload,
): Promise<void> {
  await apiClient.patch(`/api/boards/${boardId}/comments/${commentId}`, payload)
}
