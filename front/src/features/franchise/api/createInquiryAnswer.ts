import { apiClient } from '@/shared/api/client'

export async function createInquiryAnswer(inquiryId: number, answer: string): Promise<void> {
  await apiClient.post(`/api/franchise-inquiries/${inquiryId}/answers`, { answer })
}
