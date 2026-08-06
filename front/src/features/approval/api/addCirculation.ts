import { apiClient } from '@/shared/api/client'

export async function addCirculation(draftId: number, empIds: number[]): Promise<void> {
  await apiClient.post(`/api/drafts/${draftId}/circulations`, { empIds })
}
