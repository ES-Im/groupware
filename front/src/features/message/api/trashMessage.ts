import { apiClient } from '@/shared/api/client'

/**
 * 쪽지 휴지통 이동(`SENT_MESSAGE_TRASH`/`RECEIVED_MESSAGE_TRASH`, F1512 →
 * `PATCH /api/messages/{sent|received}/{messageId}/trash`, 권한 발신자/수신자,
 * ROADMAP(MESSAGE) T3.4-a). path-parameters.adoc 실측: 요청 본문 없음(path param
 * messageId). 성공 시 `204 No Content`.
 *
 * SENT_/RECEIVED_ 2-variant는 T2.1 getMessages의 box-variant 통합 선례와 동형으로,
 * isSentByMe 인자 하나로 경로 세그먼트만 분기하는 단일 함수로 축약한다(variant별 파일
 * 분리는 오버엔지니어링). 발신/수신 본인 여부는 서버가 최종 판정하며, 실패는 호출부
 * apiError 처리로 위임한다.
 */
export async function trashMessage(messageId: number, isSentByMe: boolean): Promise<void> {
  const box = isSentByMe ? 'sent' : 'received'
  await apiClient.patch(`/api/messages/${box}/${messageId}/trash`)
}
