import { apiClient } from '@/shared/api/client'
import type { BoardDetailResponse } from '../model/board'

/**
 * 게시글 상세 조회(`BOARD_DETAIL`, api-endpoint.md 기능ID `BOARD_DETAIL` →
 * `GET /api/boards/{boardId}`, minRole EMPLOYEE).
 *
 * 진입 시 서버가 조회수(viewCount)를 증가시킨다(§참조 계약 매핑). 프론트는 클라 낙관적 갱신을
 * 하지 않고 이 응답을 그대로 신뢰하며, 최신 viewCount 반영은 재조회에 맡긴다.
 */
export async function getBoardDetail(boardId: number): Promise<BoardDetailResponse> {
  const { data } = await apiClient.get<BoardDetailResponse>(`/api/boards/${boardId}`)
  return data
}
