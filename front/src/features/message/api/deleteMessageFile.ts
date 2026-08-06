import { apiClient } from '@/shared/api/client'

export async function deleteMessageFile(messageId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/messages/${messageId}/files/${fileId}`)
}
