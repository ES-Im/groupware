import { apiClient } from '@/shared/api/client'

export async function deleteMeetingRoomFile(meetingRoomId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/meeting-rooms/${meetingRoomId}/files/${fileId}`)
}
