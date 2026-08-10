import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'

export interface MessageCreateRequest {
  title: string
  content: string
  receiverIds?: number[]
}

export type MessageSendRequest = MessageCreateRequest & { receiverIds: number[] }

export async function sendMessage(payload: MessageSendRequest): Promise<RegisterDomainIdResponse> {
  const { data } = await apiClient.post<RegisterDomainIdResponse>('/api/messages', payload)
  return data
}
