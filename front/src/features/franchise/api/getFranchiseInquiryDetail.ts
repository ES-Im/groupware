import { apiClient } from '@/shared/api/client'
import type { FranchiseInquiryDetail } from '../model/franchise'

/**
 * 가맹점 문의 상세 조회(`FRANCHISE_INQUIRY_DETAIL`, api-endpoint.md 기능ID
 * `FRANCHISE_INQUIRY_DETAIL` → `GET /api/franchise-inquiries/{inquiryId}`, minRole FRANCHISE 또는 ADMIN).
 */
export async function getFranchiseInquiryDetail(inquiryId: number): Promise<FranchiseInquiryDetail> {
  const { data } = await apiClient.get<FranchiseInquiryDetail>(
    `/api/franchise-inquiries/${inquiryId}`,
  )
  return data
}
