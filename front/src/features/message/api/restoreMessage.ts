import { apiClient } from '@/shared/api/client'

/**
 * 쪽지 휴지통 복구(`SENT_MESSAGE_RESTORE`/`RECEIVED_MESSAGE_RESTORE`, F1513 →
 * `PATCH /api/messages/{sent|received}/{messageId}/trash/restoration`, 권한 발신자/수신자,
 * ROADMAP(MESSAGE) T3.4-a). path-parameters.adoc 실측: 요청 본문 없음(path param
 * messageId). 성공 시 `204 No Content`. 휴지통 항목을 원 메일박스(보낸함/받은함)로 되돌린다.
 *
 * trashMessage와 동형으로 isSentByMe 인자 하나로 경로 세그먼트만 분기한다. 발신/수신
 * 본인 여부·휴지통 상태 여부는 서버가 최종 판정하며, 실패는 호출부 apiError 처리로 위임한다.
 */
export async function restoreMessage(messageId: number, isSentByMe: boolean): Promise<void> {
  const box = isSentByMe ? 'sent' : 'received'
  await apiClient.patch(`/api/messages/${box}/${messageId}/trash/restoration`)
}
