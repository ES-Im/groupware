import { apiClient } from '@/shared/api/client'

export interface CreateMeetingRoomPayload {
  name: string
  description: string
  capacity: number
}

export interface CreateMeetingRoomResult {
  meetingRoomId: number
}

export async function createMeetingRoom(payload: CreateMeetingRoomPayload): Promise<CreateMeetingRoomResult> {
  const { data } = await apiClient.post<CreateMeetingRoomResult>('/api/meeting-rooms', payload)
  return data
}
