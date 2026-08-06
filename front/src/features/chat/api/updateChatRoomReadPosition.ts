import { apiClient } from '@/shared/api/client'

export async function updateChatRoomReadPosition(
  roomId: number,
  lastReadMessageId: number,
): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/read-position`, { lastReadMessageId })
}
