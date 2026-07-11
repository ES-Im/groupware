import { apiClient } from '@/shared/api/client'

/**
 * 임시 쪽지 삭제(`MESSAGE_DRAFT_DELETE`, F1518 → `DELETE /api/messages/drafts/{messageId}`,
 * 쪽지 작성자, ROADMAP(MESSAGE) T5.3-a). http-request.adoc 실측: 요청 본문 없음(path param
 * messageId), 성공 시 `204 No Content`.
 *
 * 실패(작성자 아님·이미 발송됨 등 서버 최종 판정)는 에러를 그대로 던져 호출부의
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다(sendDraft 동형).
 */
export async function deleteDraft(messageId: number): Promise<void> {
  await apiClient.delete(`/api/messages/drafts/${messageId}`)
}
