import type { InfiniteData } from '@tanstack/react-query'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'

/**
 * 두 메시지의 방문(putOnScreen) 순서를 비교한다. 서버가 확정한 메시지의 `id`(브로드캐스트에서는
 * `chatId`로 내려오고 parseChatBroadcastMessage.ts가 `id`로 정규화)는 DB PK라 총 순서(total
 * order)를 보장하지만, 서로 다른 두 클라이언트가 STOMP 브로드캐스트를 **받는 순서**는 서버가 실제로
 * 처리한 순서와 다를 수 있다(각 구독 커넥션의 네트워크 지연이 다르기 때문 — 동일 브로커가 두
 * 구독자에게 보내는 프레임 전달 순서는 전역적으로 보장되지 않는다). "받은 순서 그대로 append"만
 * 하면 두 사용자 화면에서 같은 대화의 메시지 순서가 서로 어긋나는 버그가 생긴다(실사용 중 실측
 * 재현: 김영희가 보낸 메시지 2건이 상대방 화면에서만 순서가 뒤바뀜) — 그래서 upsert 시 항상 이
 * 비교자로 재정렬해 도착 순서와 무관하게 동일한 최종 순서를 보장한다.
 *
 * `id`가 양수가 아니면(useSendChatMessage.ts의 낙관 렌더 임시 id — 채번기가 -1부터 감소) 아직
 * 서버가 확정하지 않은 메시지다. 확정 메시지는 항상 미확정 메시지보다 앞선다(과거에 이미
 * 영속화됐으므로). 미확정 메시지끼리는 채번기가 감소하므로 먼저 생성된 쪽의 id가 더 크다(0에 더
 * 가깝다) — 내림차순 비교로 생성 순서를 유지한다.
 */
function compareChatMessages(a: ChatMessage, b: ChatMessage): number {
  const isAConfirmed = a.id > 0
  const isBConfirmed = b.id > 0
  if (isAConfirmed !== isBConfirmed) {
    return isAConfirmed ? -1 : 1
  }
  return isAConfirmed ? a.id - b.id : b.id - a.id
}

/**
 * 채팅 메시지 cursor 무한쿼리 캐시(`InfiniteData<ChatMessagesPage>`, `chatKeys.messages(roomId)`)에
 * 메시지 하나를 upsert한다(ROADMAP(CHAT) T2.3-b, F904 실시간 수신 append + `clientMessageId` dedup).
 *
 * - 이미 동일한 `clientMessageId`를 가진 메시지가 어느 페이지에든 있으면 그 자리를 새 메시지로
 *   **교체**한다(확정). 이 자료구조는 향후 T2.4(낙관 발신)가 그대로 재사용할 수 있도록 설계했다:
 *   T2.4는 SEND 직후 임시 메시지를 이 함수로 upsert(최초 삽입)하고, 이후 서버 브로드캐스트가 같은
 *   `clientMessageId`를 echo하면 이 함수가 같은 자리를 찾아 서버가 확정한 값으로 교체한다 — 별도
 *   dedup 로직을 새로 만들 필요가 없다.
 * - 일치하는 `clientMessageId`가 없으면 새 메시지로 보고, **최초 페이지**(cursor 없이 조회한 최신
 *   배치 — `useChatMessagesQuery` 참조)에 추가한다. 교체·추가 이후에는 해당 페이지를 항상
 *   `compareChatMessages`로 재정렬한다 — 도착 순서가 아니라 서버 확정 순서(`id`)를 최종 진실로
 *   삼아, 두 클라이언트가 브로드캐스트를 받는 순서가 달라도 동일한 메시지 순서를 보장한다.
 * - 캐시에 아직 페이지가 없으면(예: 최초 목록 조회가 끝나기 전에 브로드캐스트가 먼저 도착) 그대로
 *   반환한다 — 페이지 구조(cursor/hasNext 등)를 알 수 없는 상태에서 임의로 페이지를 만들어내지
 *   않는다. 이 메시지는 서버에 이미 영속화된 뒤이므로, 최초 목록 조회가 끝나면 REST 응답에 포함돼
 *   자연히 반영된다.
 */
export function upsertChatMessage(
  data: InfiniteData<ChatMessagesPage> | undefined,
  message: ChatMessage,
): InfiniteData<ChatMessagesPage> | undefined {
  if (!data || data.pages.length === 0) {
    return data
  }

  const duplicatePageIndex = data.pages.findIndex((page) =>
    page.messages.some((existing) => existing.clientMessageId === message.clientMessageId),
  )

  if (duplicatePageIndex === -1) {
    const [latestPage, ...restPages] = data.pages
    const messages = [...latestPage.messages, message].sort(compareChatMessages)
    return {
      ...data,
      pages: [{ ...latestPage, messages }, ...restPages],
    }
  }

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === duplicatePageIndex
        ? {
            ...page,
            messages: page.messages
              .map((existing) =>
                existing.clientMessageId === message.clientMessageId ? message : existing,
              )
              .sort(compareChatMessages),
          }
        : page,
    ),
  }
}
