import { apiClient } from '@/shared/api/client'
import type { FileListInfo } from '../model/messageTypes'

export async function getMessageFiles(messageId: number): Promise<FileListInfo[]> {
  const { data } = await apiClient.get<FileListInfo[]>(`/api/messages/${messageId}/files`)
  return data
}
