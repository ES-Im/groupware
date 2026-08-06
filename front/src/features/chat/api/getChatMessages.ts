import { apiClient } from '@/shared/api/client'
import type { ChatMessagesPage } from '../model/chatMessage'

export async function getChatMessages(
  roomId: number,
  params?: { cursor?: number; size?: number },
): Promise<ChatMessagesPage> {
  const query: Record<string, number> = {}
  if (params?.cursor != null) {
    query.cursor = params.cursor
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<ChatMessagesPage>(
    `/api/chat/rooms/${roomId}/messages`,
    { params: query },
  )
  return data
}
