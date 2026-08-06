import { apiClient } from '@/shared/api/client'

export async function deleteBoardFile(boardId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/boards/${boardId}/files/${fileId}`)
}
