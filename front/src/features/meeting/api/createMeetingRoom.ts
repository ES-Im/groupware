import { apiClient } from '@/shared/api/client'

/** 회의실 등록 요청 payload(`MEETING_ROOM_CREATE`, request-fields.adoc 실측 기준(추측 금지)). */
export interface CreateMeetingRoomPayload {
  name: string
  description: string
  capacity: number
}

/** 회의실 등록 응답(response-fields.adoc 실측: 생성된 회의실 식별 번호). */
export interface CreateMeetingRoomResult {
  meetingRoomId: number
}

/**
 * 회의실 등록(`MEETING_ROOM_CREATE`, api-endpoint.md 기능ID `MEETING_ROOM_CREATE` →
 * `POST /api/meeting-rooms`, 권한 FACILITY). 성공 시 `201 Created` + `{ meetingRoomId }`
 * (response-fields.adoc 실측). 이름 중복 등 서버 판정 실패는 그대로 던져 호출부(T6.3-b)가
 * handleApiError로 위임하도록 둔다.
 */
export async function createMeetingRoom(payload: CreateMeetingRoomPayload): Promise<CreateMeetingRoomResult> {
  const { data } = await apiClient.post<CreateMeetingRoomResult>('/api/meeting-rooms', payload)
  return data
}
