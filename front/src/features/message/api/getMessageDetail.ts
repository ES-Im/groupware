import { apiClient } from '@/shared/api/client'
import type { MessageDetailResponse } from '../model/messageTypes'

export async function getMessageDetail(messageId: number): Promise<MessageDetailResponse> {
  const { data } = await apiClient.get<MessageDetailResponse>(`/api/messages/${messageId}`)
  return data
}
