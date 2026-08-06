import { apiClient } from '@/shared/api/client'

export async function removeCirculation(draftId: number, empId: number): Promise<void> {
  await apiClient.delete(`/api/drafts/${draftId}/circulations/${empId}`)
}
