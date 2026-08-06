import { apiClient } from '@/shared/api/client'
import type { ChatRoomListItem } from '../model/chatRoom'

export async function getChatRooms(params?: {
  keyword?: string
  isBookmark?: boolean
}): Promise<ChatRoomListItem[]> {
  const query: Record<string, string | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.isBookmark != null) {
    query.isBookmark = params.isBookmark
  }
  const { data } = await apiClient.get<ChatRoomListItem[]>('/api/chat/rooms', { params: query })
  return data
}
