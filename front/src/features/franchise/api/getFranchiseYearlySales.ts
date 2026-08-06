import { apiClient } from '@/shared/api/client'
import type { FranchiseYearlySales } from '../model/franchise'

export async function getFranchiseYearlySales(
  franchiseId: number,
  year: number,
): Promise<FranchiseYearlySales> {
  const { data } = await apiClient.get<FranchiseYearlySales>(
    `/api/franchises/${franchiseId}/sales/years/${year}`,
  )
  return data
}
