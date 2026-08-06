import { apiClient } from '@/shared/api/client'

export async function leaveChatRoom(roomId: number): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/leave`)
}
