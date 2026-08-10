import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'

export interface CreateMeetingRoomPayload {
  name: string
  description: string
  capacity: number
}

export async function createMeetingRoom(
  payload: CreateMeetingRoomPayload,
): Promise<RegisterDomainIdResponse> {
  const { data } = await apiClient.post<RegisterDomainIdResponse>('/api/meeting-rooms', payload)
  return data
}
