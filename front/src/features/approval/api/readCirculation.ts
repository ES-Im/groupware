import { apiClient } from '@/shared/api/client'

export async function readCirculation(draftId: number): Promise<void> {
  await apiClient.patch(`/api/drafts/${draftId}/circulations/me/read`)
}
