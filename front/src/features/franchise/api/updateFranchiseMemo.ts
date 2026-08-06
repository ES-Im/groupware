import { apiClient } from '@/shared/api/client'

export async function updateFranchiseMemo(franchiseId: number, memo: string): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/memo`, { memo })
}
