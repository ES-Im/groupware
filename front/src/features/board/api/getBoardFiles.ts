import { apiClient } from '@/shared/api/client'
import type { BoardFileInfo } from '../model/board'

/**
 * 게시글 첨부파일 목록 조회(`BOARD_FILES`, api-endpoint.md 기능ID `BOARD_FILES` →
 * `GET /api/boards/{boardId}/files`, minRole EMPLOYEE).
 */
export async function getBoardFiles(boardId: number): Promise<BoardFileInfo[]> {
  const { data } = await apiClient.get<BoardFileInfo[]>(`/api/boards/${boardId}/files`)
  return data
}
