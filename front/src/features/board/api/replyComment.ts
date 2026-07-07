import { apiClient } from '@/shared/api/client'
import type { CommentPayload } from '../model/board'

/**
 * 1-depth 대댓글 등록(`COMMENT_REPLY`, api-endpoint.md 기능ID `COMMENT_REPLY` →
 * `POST /api/boards/{boardId}/comments/{parentCommentId}/replies`, minRole EMPLOYEE(활성 사원)).
 * 요청 필드는 content 단일(300자 이하·공백 불가, request-fields.adoc 실측 — COMMENT_REGISTER와
 * 완전히 동일). 성공 시 `201 Created`·응답 본문 없음.
 *
 * **대댓글에 재대댓글 금지**(PRD F315, §참조 계약 매핑)는 서버 최종 판단 대상이 아니라 UI에서
 * 답글 버튼을 노출하지 않는 방식으로 처리한다(T14.2 범위) — 이 함수 자체는 depth를 검증하지
 * 않는다.
 */
export async function replyComment(
  boardId: number,
  parentCommentId: number,
  payload: CommentPayload,
): Promise<void> {
  await apiClient.post(`/api/boards/${boardId}/comments/${parentCommentId}/replies`, payload)
}
