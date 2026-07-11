import { apiClient } from '@/shared/api/client'
import type { FranchiseDetail } from '../model/franchise'

/**
 * 가맹점 상세 조회(`FRANCHISE_DETAIL`, api-endpoint.md 기능ID `FRANCHISE_DETAIL` →
 * `GET /api/franchises/{franchiseId}`, minRole FRANCHISE 또는 ADMIN).
 */
export async function getFranchiseDetail(franchiseId: number): Promise<FranchiseDetail> {
  const { data } = await apiClient.get<FranchiseDetail>(`/api/franchises/${franchiseId}`)
  return data
}
