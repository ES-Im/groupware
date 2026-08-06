import { apiClient } from '@/shared/api/client'

export async function likeBoard(boardId: number): Promise<void> {
  await apiClient.post(`/api/boards/${boardId}/likes`)
}
