import { apiClient } from '@/shared/api/client'

export async function activateMeetingRoom(meetingRoomId: number): Promise<void> {
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}/activate`)
}

export async function deactivateMeetingRoom(meetingRoomId: number): Promise<void> {
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}/deactivate`)
}
