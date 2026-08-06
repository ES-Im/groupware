import { apiClient } from '@/shared/api/client'
import type { FranchiseInquiryDetail } from '../model/franchise'

export async function getFranchiseInquiryDetail(inquiryId: number): Promise<FranchiseInquiryDetail> {
  const { data } = await apiClient.get<FranchiseInquiryDetail>(
    `/api/franchise-inquiries/${inquiryId}`,
  )
  return data
}
