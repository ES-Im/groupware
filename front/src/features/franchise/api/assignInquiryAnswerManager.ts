import { apiClient } from '@/shared/api/client'

export async function assignInquiryAnswerManager(
  inquiryId: number,
  assignedEmpId: number,
): Promise<void> {
  await apiClient.patch(`/api/franchise-inquiries/${inquiryId}/assign-answer`, null, {
    params: { assignedEmpId },
  })
}
