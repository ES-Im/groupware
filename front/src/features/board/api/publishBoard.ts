import { apiClient } from '@/shared/api/client'

export async function publishBoard(boardId: number): Promise<void> {
  await apiClient.patch(`/api/boards/${boardId}/publishment`)
}
