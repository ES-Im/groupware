import { apiClient } from '@/shared/api/client'

/**
 * 회의실 안내 이미지 업로드(`MEETING_ROOM_FILE_UPLOAD`, api-endpoint.md 기능ID
 * `MEETING_ROOM_FILE_UPLOAD` → `PATCH /api/meeting-rooms/{meetingRoomId}/files`, 권한 FACILITY).
 *
 * multipart part명은 `file` 단수 1개만 문서화되어 있다(request-parts.adoc 실측,
 * uploadBoardFile.ts와 동형). FormData를 body로 넘기면 axios가
 * `Content-Type: multipart/form-data; boundary=...`를 자동으로 설정하므로 별도 헤더 지정은 하지
 * 않는다. 성공 시 `204 No Content`(http-response.adoc 실측).
 */
export async function uploadMeetingRoomFile(meetingRoomId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}/files`, formData)
}
