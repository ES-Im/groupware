import { apiClient } from '@/shared/api/client'

export async function unbookmarkChatRoom(roomId: number): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/unbookmark`)
}
