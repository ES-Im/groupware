import { apiClient } from '@/shared/api/client'
import type { BoardDetailResponse } from '../model/board'

export async function getBoardDetail(boardId: number): Promise<BoardDetailResponse> {
  const { data } = await apiClient.get<BoardDetailResponse>(`/api/boards/${boardId}`)
  return data
}
