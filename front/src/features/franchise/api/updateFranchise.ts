import { apiClient } from '@/shared/api/client'

export interface FranchiseUpdatePayload {
  businessNumber?: string
  franchiseName?: string
  address?: string
  ownerName?: string
  contactNumber?: string
  contactEmail?: string
}

export async function updateFranchise(franchiseId: number, payload: FranchiseUpdatePayload): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}`, payload)
}
