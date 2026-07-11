import { apiClient } from '@/shared/api/client'

/**
 * 답변 초안 수정(`FRANCHISE_INQUIRY_ANSWER_UPDATE`, api-endpoint.md 기능ID
 * `FRANCHISE_INQUIRY_ANSWER_UPDATE` → `PATCH /api/franchise-inquiries/{inquiryId}/answers`,
 * minRole FRANCHISE 또는 ADMIN(답변 담당자)).
 * 요청 body는 생성과 동일하게 `answer` 필수·공백 불가(request-fields.adoc 실측). 미제출
 * (isSubmitted=false) 상태에서만 허용되며, 위반 시 서버가 도메인 예외로 거부한다(사전 필터링
 * 발명 금지). 성공 시 `204 No Content`.
 */
export async function updateInquiryAnswer(inquiryId: number, answer: string): Promise<void> {
  await apiClient.patch(`/api/franchise-inquiries/${inquiryId}/answers`, { answer })
}
