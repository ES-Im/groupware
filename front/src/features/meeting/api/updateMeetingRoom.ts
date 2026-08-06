import { apiClient } from '@/shared/api/client'

export interface UpdateMeetingRoomPayload {
  name?: string
  description?: string
  capacity?: number
}

export async function updateMeetingRoom(meetingRoomId: number, payload: UpdateMeetingRoomPayload): Promise<void> {
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}`, payload)
}
