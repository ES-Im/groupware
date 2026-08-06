import type { InfiniteData } from '@tanstack/react-query'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'

function compareChatMessages(a: ChatMessage, b: ChatMessage): number {
  const isAConfirmed = a.id > 0
  const isBConfirmed = b.id > 0
  if (isAConfirmed !== isBConfirmed) {
    return isAConfirmed ? -1 : 1
  }
  return isAConfirmed ? a.id - b.id : b.id - a.id
}

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
