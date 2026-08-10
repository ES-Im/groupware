import { apiClient } from '@/shared/api/client'

export async function deleteBoard(boardId: number): Promise<void> {
  await apiClient.delete(`/api/boards/${boardId}`)
}
