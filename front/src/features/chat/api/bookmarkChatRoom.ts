import { apiClient } from '@/shared/api/client'

export async function bookmarkChatRoom(roomId: number): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/bookmark`)
}
