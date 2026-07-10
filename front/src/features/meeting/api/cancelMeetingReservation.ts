import { apiClient } from '@/shared/api/client'

/**
 * 회의 예약 취소(`MEETING_RESERVATION_CANCEL`, api-endpoint.md 기능ID `MEETING_RESERVATION_CANCEL` →
 * `PATCH /api/meetings/{meetingId}/cancel`, 권한=예약자 본인). 요청 본문 없음(request-body.adoc
 * 실측 — publishBoard.ts와 동일 패턴). 성공 시 `204 No Content`(response-body.adoc 실측). 소유자
 * 불일치·이미 취소된 예약 등 서버 판정은 그대로 던져 호출부(T4.3-c)가 handleApiError로 위임하도록
 * 둔다(토스트 문구 재구현 금지).
 */
export async function cancelMeetingReservation(meetingId: number): Promise<void> {
  await apiClient.patch(`/api/meetings/${meetingId}/cancel`)
}
