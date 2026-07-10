import { apiClient } from '@/shared/api/client'

/**
 * 회의 예약 수정 요청 페이로드(`MEETING_RESERVATION_UPDATE`, request-fields.adoc 실측 기준
 * (추측 금지)) — 전 필드 optional(변경 필드만 전송). meetingDate는 `yyyy-MM-dd`, startAt/endAt은
 * `HH:mm`(PRD §계약 실측 메모 Open Q#5, createMeetingReservation.ts와 동일 전송 포맷)이다.
 */
export interface MeetingReservationUpdatePayload {
  meetingDate?: string
  startAt?: string
  endAt?: string
  meetingRoomId?: number
  title?: string
}

/**
 * 회의 예약 수정(`MEETING_RESERVATION_UPDATE`, api-endpoint.md 기능ID `MEETING_RESERVATION_UPDATE` →
 * `PATCH /api/meetings/{meetingId}/reservation-info`, 권한=예약자 본인). 성공 시 `204 No Content`
 * (response-body.adoc 실측). 소유자 불일치·기간 위반 등 서버 판정은 그대로 던져 호출부(T4.3-b)가
 * handleApiError로 위임하도록 둔다(토스트 문구 재구현 금지).
 */
export async function updateMeetingReservationInfo(
  meetingId: number,
  payload: MeetingReservationUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/meetings/${meetingId}/reservation-info`, payload)
}
