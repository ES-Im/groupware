import { apiClient } from '@/shared/api/client'

/**
 * 답변 발송(`FRANCHISE_INQUIRY_ANSWER_SEND`, api-endpoint.md 기능ID
 * `FRANCHISE_INQUIRY_ANSWER_SEND` → `PATCH /api/franchise-inquiries/{inquiryId}/answers/send`,
 * Path only, minRole FRANCHISE 또는 ADMIN(답변 담당자)). 성공 시 `204 No Content`.
 * 발송 후에는 답변 수정이 불가능하며 이 역시 서버가 최종 판정한다(사전 필터링 발명 금지).
 */
export async function sendInquiryAnswer(inquiryId: number): Promise<void> {
  await apiClient.patch(`/api/franchise-inquiries/${inquiryId}/answers/send`)
}
