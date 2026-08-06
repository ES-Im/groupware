import { apiClient } from '@/shared/api/client'
import type { BusinessStatusCode } from '../model/franchise'

export async function updateFranchiseStatus(
  franchiseId: number,
  status: BusinessStatusCode,
): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/status`, null, { params: { status } })
}
