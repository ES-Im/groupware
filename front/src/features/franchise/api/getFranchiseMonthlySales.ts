import { apiClient } from '@/shared/api/client'
import type { FranchiseMonthlySales } from '../model/franchise'

export async function getFranchiseMonthlySales(
  franchiseId: number,
  yearMonth: string,
): Promise<FranchiseMonthlySales> {
  const { data } = await apiClient.get<FranchiseMonthlySales>(
    `/api/franchises/${franchiseId}/sales/months/${yearMonth}`,
  )
  return data
}
