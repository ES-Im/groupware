import { apiClient } from '@/shared/api/client'

export async function deleteComment(boardId: number, commentId: number): Promise<void> {
  await apiClient.delete(`/api/boards/${boardId}/comments/${commentId}`)
}
