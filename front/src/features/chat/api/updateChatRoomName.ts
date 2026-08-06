import { apiClient } from '@/shared/api/client'

export async function updateChatRoomName(roomId: number, name: string): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/name`, { name })
}
