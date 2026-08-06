import { apiClient } from '@/shared/api/client'

export interface CreateChatRoomPayload {
  memberIds: number[]
}

export interface CreateChatRoomResult {
  roomId: number
}

export async function createChatRoom(payload: CreateChatRoomPayload): Promise<CreateChatRoomResult> {
  const { data } = await apiClient.post<CreateChatRoomResult>('/api/chat/rooms', payload)
  return data
}
