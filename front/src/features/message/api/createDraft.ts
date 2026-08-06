import { apiClient } from '@/shared/api/client'
import type { MessageCreateRequest, MessageCreateResult } from './sendMessage'

export async function createDraft(payload: MessageCreateRequest): Promise<MessageCreateResult> {
  const { data } = await apiClient.post<MessageCreateResult>('/api/messages/drafts', payload)
  return data
}
