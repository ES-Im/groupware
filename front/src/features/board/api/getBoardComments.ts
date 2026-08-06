import { apiClient } from '@/shared/api/client'
import type { BoardCommentPage } from '../model/board'

export async function getBoardComments(
  boardId: number,
  params?: { page?: number; size?: number },
): Promise<BoardCommentPage> {
  const query: Record<string, number> = {}
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<BoardCommentPage>(`/api/boards/${boardId}/comments`, {
    params: query,
  })
  return data
}
