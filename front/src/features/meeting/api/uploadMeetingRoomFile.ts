import { apiClient } from '@/shared/api/client'

export async function uploadMeetingRoomFile(meetingRoomId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}/files`, formData)
}
