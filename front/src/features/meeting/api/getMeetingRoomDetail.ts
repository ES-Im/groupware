import { apiClient } from '@/shared/api/client'
import type { MeetingRoomDetail } from '../model/meeting'

/**
 * 회의실 상세 조회(`MEETING_ROOM_DETAIL`, api-endpoint.md 기능ID `MEETING_ROOM_DETAIL` →
 * `GET /api/meeting-rooms/{meetingRoomId}`, 권한 EMPLOYEE).
 */
export async function getMeetingRoomDetail(meetingRoomId: number): Promise<MeetingRoomDetail> {
  const { data } = await apiClient.get<MeetingRoomDetail>(`/api/meeting-rooms/${meetingRoomId}`)
  return data
}
