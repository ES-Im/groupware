import { apiClient } from '@/shared/api/client'
import type { FranchiseDailySales } from '../model/franchise'

export async function getFranchiseDailySales(
  franchiseId: number,
  date: string,
): Promise<FranchiseDailySales> {
  const { data } = await apiClient.get<FranchiseDailySales>(
    `/api/franchises/${franchiseId}/sales/dates/${date}`,
  )
  return data
}
