import { apiClient } from '@/shared/api/client'

/**
 * 회의실 안내 이미지 삭제(`MEETING_ROOM_FILE_DELETE`, api-endpoint.md 기능ID
 * `MEETING_ROOM_FILE_DELETE` → `DELETE /api/meeting-rooms/{meetingRoomId}/files/{fileId}`,
 * 권한 FACILITY). 성공 시 `204 No Content`(http-response.adoc 실측).
 */
export async function deleteMeetingRoomFile(meetingRoomId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/meeting-rooms/${meetingRoomId}/files/${fileId}`)
}
