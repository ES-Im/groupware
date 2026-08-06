import { apiClient } from '@/shared/api/client'
import type { BoardUpdateRequest } from '../model/board'

export async function updateBoard(boardId: number, payload: BoardUpdateRequest): Promise<void> {
  await apiClient.patch(`/api/boards/${boardId}`, payload)
}
