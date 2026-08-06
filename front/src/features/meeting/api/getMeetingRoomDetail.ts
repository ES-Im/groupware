import { apiClient } from '@/shared/api/client'
import type { MeetingRoomDetail } from '../model/meeting'

export async function getMeetingRoomDetail(meetingRoomId: number): Promise<MeetingRoomDetail> {
  const { data } = await apiClient.get<MeetingRoomDetail>(`/api/meeting-rooms/${meetingRoomId}`)
  return data
}
