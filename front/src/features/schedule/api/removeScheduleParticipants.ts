import { apiClient } from '@/shared/api/client'
import type { ScheduleScope } from '../lib/scheduleTypes'

/**
 * 일정 참여자 제외(`SCHEDULE_PARTICIPANTS_REMOVE`, api-endpoint.md 기능ID
 * `SCHEDULE_PARTICIPANTS_REMOVE` → `PATCH /api/schedules/{scheduleId}/participants`, 권한=일정
 * 소유자). `participantIds`는 필수·빈 배열 및 null 요소 불가(request-fields.adoc 실측) — 서버 제약과
 * 동형으로 요청 전 클라이언트에서 사전 차단한다. "일정 소유자 제외 불가"는 서버가 최종 판정하므로
 * (request-fields.adoc 실측) 여기서는 사전 차단하지 않고 그대로 던져 호출부가 handleApiError로
 * 위임하도록 둔다. scope는 선택 쿼리로 미입력 시 서버가 SINGLE(기본값)로 처리한다. 성공 시
 * `204 No Content`(response-body.adoc 실측).
 */
export async function removeScheduleParticipants(
  scheduleId: number,
  participantIds: number[],
  scope?: ScheduleScope,
): Promise<void> {
  if (participantIds.length === 0 || participantIds.some((id) => id == null)) {
    throw new Error('제외할 참여자를 1명 이상 선택해주세요.')
  }
  await apiClient.patch(
    `/api/schedules/${scheduleId}/participants`,
    { participantIds },
    { params: { scope } },
  )
}
