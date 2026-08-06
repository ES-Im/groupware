import { apiClient } from '@/shared/api/client'
import type { MessageCountResponse } from '../model/messageTypes'

export async function getMailboxCounts(): Promise<MessageCountResponse> {
  const { data } = await apiClient.get<MessageCountResponse>('/api/messages/mailboxes/counts')
  return data
}
