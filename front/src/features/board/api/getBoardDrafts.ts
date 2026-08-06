import { apiClient } from '@/shared/api/client'
import type { BoardDraftSummary } from '../model/board'

export async function getBoardDrafts(): Promise<BoardDraftSummary[]> {
  const { data } = await apiClient.get<BoardDraftSummary[]>('/api/my/boards/drafts')
  return data
}
