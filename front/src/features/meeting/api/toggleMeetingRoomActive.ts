import { apiClient } from '@/shared/api/client'

/**
 * 회의실 활성화(`MEETING_ROOM_ACTIVATE`, api-endpoint.md 기능ID `MEETING_ROOM_ACTIVATE` →
 * `PATCH /api/meeting-rooms/{meetingRoomId}/activate`, 권한 FACILITY). path meetingRoomId만
 * 사용하고 요청 본문은 없다(request-body.adoc 실측 — activateDepartment.ts와 동일 패턴).
 * 성공 시 `204 No Content`(http-response.adoc 실측).
 */
export async function activateMeetingRoom(meetingRoomId: number): Promise<void> {
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}/activate`)
}

/**
 * 회의실 비활성화(`MEETING_ROOM_DEACTIVATE`, api-endpoint.md 기능ID `MEETING_ROOM_DEACTIVATE` →
 * `PATCH /api/meeting-rooms/{meetingRoomId}/deactivate`, 권한 FACILITY). path meetingRoomId만
 * 사용하고 요청 본문은 없다(request-body.adoc 실측). 성공 시 `204 No Content`(http-response.adoc 실측).
 */
export async function deactivateMeetingRoom(meetingRoomId: number): Promise<void> {
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}/deactivate`)
}
