import { apiClient } from '@/shared/api/client'
import type { ManualScheduleUpdatePayload, ScheduleScope } from '../lib/scheduleTypes'

/**
 * 수기 일정 수정(`MANUAL_SCHEDULE_UPDATE`, api-endpoint.md 기능ID `MANUAL_SCHEDULE_UPDATE` →
 * `PATCH /api/schedules/{scheduleId}`, 권한=소유자 본인). scope 쿼리(선택, 기본 SINGLE)로 이 날짜만/
 * 동일 일정 전체 적용 범위를 지정한다(query-parameters.adoc 실측). 성공 시 `204 No Content`
 * (response-body.adoc 실측). 소유자 불일치 등 서버 판정은 그대로 던져 호출부(T4.3)가 handleApiError로
 * 위임하도록 둔다.
 */
export async function updateManualSchedule(
  scheduleId: number,
  payload: ManualScheduleUpdatePayload,
  scope?: ScheduleScope,
): Promise<void> {
  await apiClient.patch(`/api/schedules/${scheduleId}`, payload, { params: { scope } })
}
