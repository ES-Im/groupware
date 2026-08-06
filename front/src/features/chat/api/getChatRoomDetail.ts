import { apiClient } from '@/shared/api/client'
import type { ChatRoomDetail } from '../model/chatRoomDetail'

export async function getChatRoomDetail(roomId: number): Promise<ChatRoomDetail> {
  const { data } = await apiClient.get<ChatRoomDetail>(`/api/chat/rooms/${roomId}`)
  return data
}
