import { apiClient } from '@/shared/api/client'

/**
 * 쪽지 완전 삭제(`SENT_MESSAGE_DELETE`/`RECEIVED_MESSAGE_DELETE`, F1514 →
 * `PATCH /api/messages/{sent|received}/{messageId}/deletion`, 권한 발신자/수신자,
 * ROADMAP(MESSAGE) T3.4-a). path-parameters.adoc 실측: 요청 본문 없음(path param
 * messageId). 성공 시 `204 No Content`. 메서드가 DELETE가 아닌 PATCH인 것은 계약 실측
 * 그대로다(발신/수신 각자 관점의 논리 삭제) — 추측으로 DELETE로 바꾸지 않는다.
 *
 * trashMessage와 동형으로 isSentByMe 인자 하나로 경로 세그먼트만 분기한다. 확인
 * AlertDialog 등 파괴적 액션 가드는 소비 UI(T3.4-b) 책임이며, 실패는 호출부 apiError
 * 처리로 위임한다.
 */
export async function deleteMessage(messageId: number, isSentByMe: boolean): Promise<void> {
  const box = isSentByMe ? 'sent' : 'received'
  await apiClient.patch(`/api/messages/${box}/${messageId}/deletion`)
}
