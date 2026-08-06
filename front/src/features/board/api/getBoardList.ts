import { apiClient } from '@/shared/api/client'
import type { BoardListPage } from '../model/board'

export async function getBoardList(
  categoryId: number,
  params?: { keyword?: string; page?: number; size?: number },
): Promise<BoardListPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<BoardListPage>(`/api/categories/${categoryId}/boards`, {
    params: query,
  })
  return data
}
