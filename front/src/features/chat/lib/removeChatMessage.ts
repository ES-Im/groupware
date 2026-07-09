import type { InfiniteData } from '@tanstack/react-query'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'

/**
 * 채팅 메시지 cursor 무한쿼리 캐시(`InfiniteData<ChatMessagesPage>`, `chatKeys.messages(roomId)`)에서
 * `clientMessageId`가 일치하는 메시지를 제거한다(ROADMAP(CHAT) T2.4, code-reviewer 지적).
 *
 * `useSendChatMessage`가 SEND 직전 `upsertChatMessage`(T2.3-b)로 미리 넣어둔 낙관 메시지를,
 * `publish()`가 동기 예외를 던져 SEND 자체가 브로커에 전달되지도 못한 것이 확실한 경우에만
 * 롤백하는 용도다 — 서버가 SEND를 수신은 했으나 멤버십/방 상태로 거부하는 경우(STOMP ERROR
 * 프레임)는 이미 전송을 시도했으므로 이 함수를 쓰지 않는다(useChatRoomSubscription의
 * onStompError가 별도로 안내한다).
 *
 * upsertChatMessage와 대칭으로 모든 페이지를 순회해 제거한다 — 낙관 메시지는 항상 최초 페이지
 * (pages[0])에 추가되지만(upsertChatMessage 참조), 롤백 시점에 캐시 구조가 그대로라는 보장이
 * 없어(예: 그 사이 다른 곳에서 캐시가 갱신됐을 가능성) 페이지 위치를 가정하지 않고 안전하게
 * 전 페이지에서 찾아 제거한다. 일치하는 메시지가 없거나 캐시가 아직 없으면 그대로 반환한다.
 */
export function removeChatMessage(
  data: InfiniteData<ChatMessagesPage> | undefined,
  clientMessageId: string,
): InfiniteData<ChatMessagesPage> | undefined {
  if (!data) {
    return data
  }

  return {
    ...data,
    pages: data.pages.map((page) => {
      const messages = page.messages.filter(
        (message: ChatMessage) => message.clientMessageId !== clientMessageId,
      )
      return messages.length === page.messages.length ? page : { ...page, messages }
    }),
  }
}
