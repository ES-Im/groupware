import { apiClient } from '@/shared/api/client'

export async function sendInquiryAnswer(inquiryId: number): Promise<void> {
  await apiClient.patch(`/api/franchise-inquiries/${inquiryId}/answers/send`)
}
