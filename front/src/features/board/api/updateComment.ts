import { apiClient } from '@/shared/api/client'
import type { CommentPayload } from '../model/board'

export async function updateComment(
  boardId: number,
  commentId: number,
  payload: CommentPayload,
): Promise<void> {
  await apiClient.patch(`/api/boards/${boardId}/comments/${commentId}`, payload)
}
