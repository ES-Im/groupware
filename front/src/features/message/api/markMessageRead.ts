import { apiClient } from '@/shared/api/client'

/**
 * 받은 쪽지 읽음 처리(`RECEIVED_MESSAGE_READ`, F1511 → `PATCH /api/messages/received/{messageId}/read`,
 * 권한 수신자, ROADMAP(MESSAGE) T3.1). http-request.adoc 실측: 요청 본문 없음(path param
 * messageId). 성공 시 `204 No Content`. 수신자 본인만 처리하며(서버 최종 판정), 실패는
 * 호출부 apiError 처리로 위임한다.
 */
export async function markMessageRead(messageId: number): Promise<void> {
  await apiClient.patch(`/api/messages/received/${messageId}/read`)
}
