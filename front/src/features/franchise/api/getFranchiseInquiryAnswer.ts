import { apiClient } from '@/shared/api/client'
import type { FranchiseInquiryAnswer } from '../model/franchise'

export async function getFranchiseInquiryAnswer(
  inquiryId: number,
): Promise<FranchiseInquiryAnswer> {
  const { data } = await apiClient.get<FranchiseInquiryAnswer>(
    `/api/franchise-inquiries/${inquiryId}/answer`,
  )
  return data
}
