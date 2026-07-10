import { apiClient } from '@/shared/api/client'

/**
 * 회의 참여자 전체 교체(`MEETING_PARTICIPANTS_REPLACE`, api-endpoint.md 기능ID
 * `MEETING_PARTICIPANTS_REPLACE` → `PATCH /api/meetings/{meetingId}/participants`,
 * 권한=예약자 본인). `participantIds`는 필수·빈 배열 불가(request-fields.adoc 실측)이며 기존
 * 참여자 목록을 전달값으로 전체 교체한다(부분 추가/삭제 아님). 성공 시 `204 No Content`
 * (response-body.adoc 실측). 소유자 불일치 등 서버 판정은 그대로 던져 호출부(T4.3-c)가
 * handleApiError로 위임하도록 둔다(토스트 문구 재구현 금지).
 */
export async function replaceMeetingParticipants(meetingId: number, participantIds: number[]): Promise<void> {
  await apiClient.patch(`/api/meetings/${meetingId}/participants`, { participantIds })
}
