import { apiClient } from '@/shared/api/client'

export async function uploadBoardFile(boardId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/boards/${boardId}/files`, formData)
}
