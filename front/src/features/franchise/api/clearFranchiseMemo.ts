import { apiClient } from '@/shared/api/client'

export async function clearFranchiseMemo(franchiseId: number): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/clear-memo`)
}
