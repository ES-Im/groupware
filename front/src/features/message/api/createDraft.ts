import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import type { MessageCreateRequest } from './sendMessage'

export async function createDraft(payload: MessageCreateRequest): Promise<RegisterDomainIdResponse> {
  const { data } = await apiClient.post<RegisterDomainIdResponse>('/api/messages/drafts', payload)
  return data
}
