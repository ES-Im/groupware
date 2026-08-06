import { apiClient } from '@/shared/api/client'

export async function updateFranchiseManager(
  franchiseId: number,
  newManagerId: number,
): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/managers`, null, {
    params: { newManagerId },
  })
}
