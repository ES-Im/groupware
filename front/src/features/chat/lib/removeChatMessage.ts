import type { InfiniteData } from '@tanstack/react-query'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'

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
