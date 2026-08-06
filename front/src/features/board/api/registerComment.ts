import { apiClient } from '@/shared/api/client'
import type { CommentPayload } from '../model/board'

export async function registerComment(boardId: number, payload: CommentPayload): Promise<void> {
  await apiClient.post(`/api/boards/${boardId}/comments`, payload)
}
