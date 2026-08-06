import { apiClient } from '@/shared/api/client'

export async function updateInquiryAnswer(inquiryId: number, answer: string): Promise<void> {
  await apiClient.patch(`/api/franchise-inquiries/${inquiryId}/answers`, { answer })
}
