import { apiClient } from '@/shared/api/client'

/**
 * 임시저장 게시글 발행(`BOARD_PUBLISH`, api-endpoint.md 기능ID `BOARD_PUBLISH` →
 * `PATCH /api/boards/{boardId}/publishment`, path `boardId`만 사용, 요청 본문 없음,
 * 작성자 또는 ADMIN, `204` Empty — path-parameters.adoc/http-response.adoc 실측 기준).
 *
 * 성공 시 `204 No Content` — 호출부(useBoardPublishMutation)가 boardKeys.detail(boardId)를
 * invalidate해 상세 화면(isDraft/발행시각 등)을 재조회한다.
 *
 * 소유권 위반 시 백엔드 실측(`BoardCommandService.validateAuthor`)은 `PermissionDeniedException`
 * (`ROLE_002`, httpStatus 401)을 던진다 — PRD가 가정한 403이 아니다. 호출부가 이 코드를
 * `isForbidden`(ROLE_003 전용 판별자)으로 분류하지 못하므로, 소비처는 handleApiError의
 * 토큰무효 분기(로그인 리다이렉트)를 타지 않도록 에러 메시지를 직접 토스트로 노출한다.
 */
export async function publishBoard(boardId: number): Promise<void> {
  await apiClient.patch(`/api/boards/${boardId}/publishment`)
}
