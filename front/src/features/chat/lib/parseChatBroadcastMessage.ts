import type { ChatMessage } from '../model/chatMessage'

/**
 * 방 토픽(`/topic/chat/rooms/{roomId}`) 브로드캐스트 프레임의 body를 파싱한다
 * (ROADMAP(CHAT) T2.3-b, F904).
 *
 * PRD Open Q#5(브로드캐스트 프레임 스키마 미문서화)를 T2.4 실제 백엔드(dev 서버) 연동 검증 중
 * 실측으로 확정했다(추측이 아니라 실제 STOMP MESSAGE 프레임 관찰) — body는 `CHAT_MESSAGES` 응답
 * item과 동일한 평면 구조가 **아니라** 이벤트 봉투로 감싸여 있다:
 * ```json
 * {
 *   "eventId": "827a1d50-...", "eventType": "MESSAGE_CREATED", "roomId": 1,
 *   "occurredAt": "2026-07-09T10:00:40.309435300Z",
 *   "data": {
 *     "chatId": 4, "roomId": 1, "senderId": 3,
 *     "clientMessageId": "96052f08-...", "senderName": "김영희",
 *     "content": "...", "sentAt": "2026-07-09T19:00:40.2600285"
 *   }
 * }
 * ```
 * 메시지 본문 필드는 최상위가 아니라 `data`에 있고, 메시지 식별자는 `id`가 아니라 `chatId`로
 * 내려온다. `CHAT_MESSAGES` REST 응답의 `id`와 동일한 PK일 것으로 보이나(필드명만 다름), 같은
 * 메시지를 두 경로로 직접 대조 확인하지는 않았다 — [INFERENCE]. dedup은 `id`가 아니라
 * `clientMessageId`로 매칭하므로(upsertChatMessage 참조) 이 값 체계 추정이 실시간 확정 흐름
 * 자체에 영향을 주지는 않는다. 실측 프레임에는 `profileImageUrl`이 아예 없었다 — optional로
 * 남겨 없으면 null로 폴백한다(이전과 동일).
 *
 * `eventType`이 있다는 것은 같은 토픽으로 향후 다른 이벤트 종류(예: 읽음 위치 갱신 등, T2.5)가 함께
 * 올 가능성을 시사한다 — `eventType !== 'MESSAGE_CREATED'`면 이 함수의 책임 밖으로 보고 null을
 * 반환해 호출부(`useChatRoomSubscription`)가 조용히 무시하게 한다(다른 이벤트 종류를 메시지로
 * 오해석해 캐시를 깨뜨리지 않기 위함).
 *
 * 필수 필드가 없거나 JSON 파싱에 실패해도 마찬가지로 null을 반환한다 — 스키마를 벗어난 프레임을
 * 화면에 잘못 렌더해 깨뜨리는 것보다, 해당 프레임을 무시하는 쪽이 안전하다.
 */
export function parseChatBroadcastMessage(body: string): ChatMessage | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const envelope = parsed as Record<string, unknown>
  if (envelope.eventType !== 'MESSAGE_CREATED') {
    return null
  }
  if (typeof envelope.data !== 'object' || envelope.data === null) {
    return null
  }

  const candidate = envelope.data as Record<string, unknown>
  if (
    typeof candidate.chatId !== 'number' ||
    typeof candidate.senderId !== 'number' ||
    typeof candidate.clientMessageId !== 'string' ||
    typeof candidate.senderName !== 'string' ||
    typeof candidate.content !== 'string' ||
    typeof candidate.sentAt !== 'string'
  ) {
    return null
  }

  return {
    id: candidate.chatId,
    senderId: candidate.senderId,
    clientMessageId: candidate.clientMessageId,
    senderName: candidate.senderName,
    content: candidate.content,
    sentAt: candidate.sentAt,
    profileImageUrl:
      typeof candidate.profileImageUrl === 'string' ? candidate.profileImageUrl : null,
  }
}
