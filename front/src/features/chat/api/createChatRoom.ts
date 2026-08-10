import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'

export interface CreateChatRoomPayload {
  memberIds: number[]
}

export async function createChatRoom(
  payload: CreateChatRoomPayload,
): Promise<RegisterDomainIdResponse> {
  const { data } = await apiClient.post<RegisterDomainIdResponse>('/api/chat/rooms', payload)
  return data
}
