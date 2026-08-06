import { apiClient } from '@/shared/api/client'

export async function uploadMessageFiles(messageId: number, files: File[]): Promise<void> {
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    await apiClient.patch(`/api/messages/${messageId}/files`, formData)
  }
}
