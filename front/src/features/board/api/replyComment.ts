import { apiClient } from '@/shared/api/client'
import type { CommentPayload } from '../model/board'

export async function replyComment(
  boardId: number,
  parentCommentId: number,
  payload: CommentPayload,
): Promise<void> {
  await apiClient.post(`/api/boards/${boardId}/comments/${parentCommentId}/replies`, payload)
}
