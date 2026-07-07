import { apiClient } from '@/shared/api/client'
import type { CommentPayload } from '../model/board'

/**
 * 최상위 댓글 등록(`COMMENT_REGISTER`, api-endpoint.md 기능ID `COMMENT_REGISTER` →
 * `POST /api/boards/{boardId}/comments`, minRole EMPLOYEE(활성 사원)).
 * 요청 필드는 content 단일(300자 이하·공백 불가, request-fields.adoc 실측). 성공 시
 * `201 Created`·응답 본문 없음(response-body.adoc 미문서화 — Empty 처리).
 */
export async function registerComment(boardId: number, payload: CommentPayload): Promise<void> {
  await apiClient.post(`/api/boards/${boardId}/comments`, payload)
}
