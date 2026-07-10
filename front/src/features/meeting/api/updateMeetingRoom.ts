import { apiClient } from '@/shared/api/client'

/**
 * 회의실 정보 수정 요청 payload(`MEETING_ROOM_UPDATE`, request-fields.adoc 실측 기준(추측 금지)).
 * 전 필드 optional — 변경할 필드만 담아 전송한다.
 */
export interface UpdateMeetingRoomPayload {
  name?: string
  description?: string
  capacity?: number
}

/**
 * 회의실 정보 수정(`MEETING_ROOM_UPDATE`, api-endpoint.md 기능ID `MEETING_ROOM_UPDATE` →
 * `PATCH /api/meeting-rooms/{meetingRoomId}`, 권한 FACILITY). 성공 시 `204 No Content`
 * (http-response.adoc 실측). 변경값이 없으면 서버가 거부한다(request-fields.adoc 실측) — 프론트는
 * 별도 사전 차단 없이 그대로 전송하고, 실패 시 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export async function updateMeetingRoom(meetingRoomId: number, payload: UpdateMeetingRoomPayload): Promise<void> {
  await apiClient.patch(`/api/meeting-rooms/${meetingRoomId}`, payload)
}
