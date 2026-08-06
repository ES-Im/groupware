import { apiClient } from '@/shared/api/client'

export async function trashMessage(messageId: number, isSentByMe: boolean): Promise<void> {
  const box = isSentByMe ? 'sent' : 'received'
  await apiClient.patch(`/api/messages/${box}/${messageId}/trash`)
}
