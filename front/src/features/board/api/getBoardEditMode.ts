import { apiClient } from '@/shared/api/client'
import type { BoardEditModeResponse } from '../model/board'

/**
 * 게시글 편집 초기값 조회(`BOARD_EDIT_MODE`, api-endpoint.md 기능ID `BOARD_EDIT_MODE` →
 * `GET /api/boards/{boardId}/edit-mode`, 권한=게시글 작성자).
 *
 * getBoardDetail(T11.1)과 달리 조회수(viewCount) 증가 등 부작용이 없는 순수 편집 초기값
 * 스냅샷이며, 응답의 modifiedAt은 없다(수정 시각은 BOARD_UPDATE 요청 시 detail의 modifiedAt을
 * 그대로 되돌려 보낸다 — 이 엔드포인트 응답에는 modifiedAt 필드 자체가 없음, response-fields.adoc
 * 실측 기준).
 */
export async function getBoardEditMode(boardId: number): Promise<BoardEditModeResponse> {
  const { data } = await apiClient.get<BoardEditModeResponse>(`/api/boards/${boardId}/edit-mode`)
  return data
}
