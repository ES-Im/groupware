import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationDetail } from '../model/franchise'

/**
 * 교육 상세 조회(`FRANCHISE_EDUCATION_DETAIL`, api-endpoint.md 기능ID `FRANCHISE_EDUCATION_DETAIL` →
 * `GET /api/franchise-educations/{educationId}`, minRole FRANCHISE 또는 ADMIN).
 * getFranchiseDetail 동형. fileListInfoList는 첨부 없음 케이스에서 null이 내려올 수 있다
 * (response-body.adoc 실측 — 소비처 null 방어 필수, Open Q#3).
 */
export async function getFranchiseEducationDetail(
  educationId: number,
): Promise<FranchiseEducationDetail> {
  const { data } = await apiClient.get<FranchiseEducationDetail>(
    `/api/franchise-educations/${educationId}`,
  )
  return data
}
