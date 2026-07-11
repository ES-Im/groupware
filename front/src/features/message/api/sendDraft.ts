import { apiClient } from '@/shared/api/client'

/**
 * 임시 쪽지 발송(`MESSAGE_DRAFT_SEND`, F1515 → `PATCH /api/messages/drafts/{messageId}/send`,
 * 쪽지 작성자, ROADMAP(MESSAGE) T4.3-a). http-request.adoc 실측: 요청 본문 없음(path param
 * messageId), 성공 시 `204 No Content`.
 *
 * 첨부 draft-first 오케스트레이션(T4.3-b)의 최종 발송 단계와 임시보관함 발송(T5.3)이 공용
 * 소비한다. 실패(작성자 아님·이미 발송됨 등 서버 최종 판정)는 에러를 그대로 던져 호출부의
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다(createLeaveDraft 동형).
 */
export async function sendDraft(messageId: number): Promise<void> {
  await apiClient.patch(`/api/messages/drafts/${messageId}/send`)
}
