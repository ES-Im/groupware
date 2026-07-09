import type { InfiniteData } from '@tanstack/react-query'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'

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
 *   배치 — `useChatMessagesQuery` 참조)의 끝에 추가한다. 페이지 내부 정렬 순서 자체는 미확정
 *   (PRD Open Q#5)이지만, 실시간으로 막 도착한 메시지는 항상 대화의 가장 최신 시점이므로 "최신
 *   페이지의 맨 끝"에 두면 `ChatRoomDetailPage`의 렌더 순서(페이지를 fetch 역순으로 나열하고 각
 *   페이지 내부는 서버 응답 순서를 그대로 유지) 기준으로 항상 화면 맨 아래(최신 위치)에 표시된다.
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
    return {
      ...data,
      pages: [{ ...latestPage, messages: [...latestPage.messages, message] }, ...restPages],
    }
  }

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === duplicatePageIndex
        ? {
            ...page,
            messages: page.messages.map((existing) =>
              existing.clientMessageId === message.clientMessageId ? message : existing,
            ),
          }
        : page,
    ),
  }
}
