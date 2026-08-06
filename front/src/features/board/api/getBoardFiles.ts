import { apiClient } from '@/shared/api/client'
import type { BoardFileInfo } from '../model/board'

export async function getBoardFiles(boardId: number): Promise<BoardFileInfo[]> {
  const { data } = await apiClient.get<BoardFileInfo[]>(`/api/boards/${boardId}/files`)
  return data
}
