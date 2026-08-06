import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { useChatStompStatus } from '../lib/chatConnectionStatus'
import { removeChatMessage } from '../lib/removeChatMessage'
import { getChatStompClient } from '../lib/stompClient'
import { upsertChatMessage } from '../lib/upsertChatMessage'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'
import { chatKeys } from '../model/queryKeys'

export const CHAT_MESSAGE_MAX_LENGTH = 2000

let nextOptimisticMessageId = -1

export function useSendChatMessage(roomId: number) {
  const stompStatus = useChatStompStatus()
  const queryClient = useQueryClient()
  const meQuery = useMeQuery()

  function sendMessage(rawContent: string): boolean {
    const content = rawContent.trim()
    if (!content) {
      return false
    }
    if (content.length > CHAT_MESSAGE_MAX_LENGTH) {
      toast.error(`메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자를 초과할 수 없습니다.`)
      return false
    }
    if (stompStatus !== 'connected') {
      toast.error('연결이 끊어져 메시지를 보낼 수 없습니다. 잠시 후 다시 시도해주세요.')
      return false
    }
    const me = meQuery.data?.empBasicInfo
    if (!me) {
      toast.error('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return false
    }

    const clientMessageId = crypto.randomUUID()
    const optimisticMessage: ChatMessage = {
      id: nextOptimisticMessageId--,
      senderId: me.empId,
      clientMessageId,
      senderName: me.name,
      content,
      sentAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      profileImageUrl: null,
    }

    queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(roomId), (old) =>
      upsertChatMessage(old, optimisticMessage),
    )

    try {
      getChatStompClient().publish({
        destination: `/app/chat/rooms/${roomId}/messages`,
        body: JSON.stringify({ clientMessageId, content }),
      })
    } catch {
      queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(roomId), (old) =>
        removeChatMessage(old, clientMessageId),
      )
      toast.error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
      return false
    }

    return true
  }

  return { sendMessage }
}
