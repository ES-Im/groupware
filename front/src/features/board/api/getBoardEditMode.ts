import { apiClient } from '@/shared/api/client'
import type { BoardEditModeResponse } from '../model/board'

export async function getBoardEditMode(boardId: number): Promise<BoardEditModeResponse> {
  const { data } = await apiClient.get<BoardEditModeResponse>(`/api/boards/${boardId}/edit-mode`)
  return data
}
