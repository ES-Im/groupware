import { apiClient } from '@/shared/api/client'
import type { FranchiseDetail } from '../model/franchise'

export async function getFranchiseDetail(franchiseId: number): Promise<FranchiseDetail> {
  const { data } = await apiClient.get<FranchiseDetail>(`/api/franchises/${franchiseId}`)
  return data
}
