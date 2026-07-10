import { apiClient } from '@/shared/api/client'
import type { MeetingRoomFile } from '../model/meeting'

/**
 * 회의실 첨부파일 목록 조회(`MEETING_ROOM_FILES`, api-endpoint.md 기능ID `MEETING_ROOM_FILES` →
 * `GET /api/meeting-rooms/{meetingRoomId}/files`, minRole EMPLOYEE).
 */
export async function getMeetingRoomFiles(meetingRoomId: number): Promise<MeetingRoomFile[]> {
  const { data } = await apiClient.get<MeetingRoomFile[]>(
    `/api/meeting-rooms/${meetingRoomId}/files`,
  )
  return data
}
