import { apiClient } from '@/shared/api/client'
import type { MeetingRoomFile } from '../model/meeting'

export async function getMeetingRoomFiles(meetingRoomId: number): Promise<MeetingRoomFile[]> {
  const { data } = await apiClient.get<MeetingRoomFile[]>(
    `/api/meeting-rooms/${meetingRoomId}/files`,
  )
  return data
}
