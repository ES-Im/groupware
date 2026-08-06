import { apiClient } from '@/shared/api/client'

export async function unlikeBoard(boardId: number): Promise<void> {
  await apiClient.delete(`/api/boards/${boardId}/likes`)
}
