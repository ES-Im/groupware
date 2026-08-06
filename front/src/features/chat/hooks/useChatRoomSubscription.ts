import { useEffect, useRef } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useChatStompStatus } from '../lib/chatConnectionStatus'
import { parseChatBroadcastMessage } from '../lib/parseChatBroadcastMessage'
import { getChatStompClient } from '../lib/stompClient'
import { upsertChatMessage } from '../lib/upsertChatMessage'
import type { ChatMessagesPage } from '../model/chatMessage'
import { chatKeys } from '../model/queryKeys'

export function useChatRoomSubscription(roomId: number | undefined): void {
  const stompStatus = useChatStompStatus()
  const queryClient = useQueryClient()
  const rejectedRoomIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (roomId === undefined || stompStatus !== 'connected') {
      return
    }
    if (rejectedRoomIdRef.current === roomId) {
      return
    }

    const client = getChatStompClient()
    const subscription = client.subscribe(`/topic/chat/rooms/${roomId}`, (frame) => {
      const incoming = parseChatBroadcastMessage(frame.body)
      if (!incoming) {
        return
      }
      queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(roomId), (old) =>
        upsertChatMessage(old, incoming),
      )
    })

    client.onStompError = (frame) => {
      rejectedRoomIdRef.current = roomId
      toast.error(frame.headers.message ?? '채팅방에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    }

    return () => {
      subscription.unsubscribe()
      client.onStompError = () => {}
    }
  }, [roomId, stompStatus, queryClient])
}
