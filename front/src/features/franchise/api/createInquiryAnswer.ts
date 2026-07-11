import { apiClient } from '@/shared/api/client'

/**
 * 답변 초안 생성(`FRANCHISE_INQUIRY_ANSWER_CREATE`, api-endpoint.md 기능ID
 * `FRANCHISE_INQUIRY_ANSWER_CREATE` → `POST /api/franchise-inquiries/{inquiryId}/answers`,
 * minRole FRANCHISE 또는 ADMIN(답변 담당자)).
 * 요청 body의 `answer`는 필수·공백 불가(request-fields.adoc 실측) — 조회 응답의 `content`와
 * 필드명이 다르다(계약 그대로, 임의 통일 금지). 성공 시 `201 Created`(Empty).
 * 답변 담당자(소유자) 조건은 서버가 403으로 최종 판정한다 — 프론트는 사전 필터링 없이 그대로
 * 요청하고, 위반 시 호출부가 handleApiError로 위임하도록 던진다.
 */
export async function createInquiryAnswer(inquiryId: number, answer: string): Promise<void> {
  await apiClient.post(`/api/franchise-inquiries/${inquiryId}/answers`, { answer })
}
