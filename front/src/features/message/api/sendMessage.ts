import { apiClient } from '@/shared/api/client'

export interface MessageCreateRequest {
  title: string
  content: string
  receiverIds?: number[]
}

export type MessageSendRequest = MessageCreateRequest & { receiverIds: number[] }

export interface MessageCreateResult {
  messageId: number
}

export async function sendMessage(payload: MessageSendRequest): Promise<MessageCreateResult> {
  const { data } = await apiClient.post<MessageCreateResult>('/api/messages', payload)
  return data
}
