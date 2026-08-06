import { apiClient } from '@/shared/api/client'
import type { DraftDetailResponse } from '../model/draftDetail'

export async function getDraftDetail(draftId: number): Promise<DraftDetailResponse> {
  const { data } = await apiClient.get<DraftDetailResponse>(`/api/drafts/${draftId}`)
  return data
}
