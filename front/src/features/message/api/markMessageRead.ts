import { apiClient } from '@/shared/api/client'

export async function markMessageRead(messageId: number): Promise<void> {
  await apiClient.patch(`/api/messages/received/${messageId}/read`)
}
