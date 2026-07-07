import { apiClient } from '@/shared/api/client'
import type { BoardDraftSummary } from '../model/board'

/**
 * 내 임시저장 게시글 목록 조회(`BOARD_DRAFTS`, api-endpoint.md 기능ID `BOARD_DRAFTS` →
 * `GET /api/my/boards/drafts`, minRole EMPLOYEE — 서버가 요청자 본인의 임시저장 글만 반환한다).
 * 요청 본문/쿼리 없음(response-body.adoc 실측 — 배열 `[{boardId,title,updatedAt}]`).
 */
export async function getBoardDrafts(): Promise<BoardDraftSummary[]> {
  const { data } = await apiClient.get<BoardDraftSummary[]>('/api/my/boards/drafts')
  return data
}
