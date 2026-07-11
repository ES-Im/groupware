import { apiClient } from '@/shared/api/client'
import type { ScheduleScope } from '../lib/scheduleTypes'

/**
 * 일정 취소(`SCHEDULE_CANCEL`, api-endpoint.md 기능ID `SCHEDULE_CANCEL` →
 * `PATCH /api/schedules/{scheduleId}/cancellation`, 권한=일정 소유자). 요청 본문 없음(request-fields
 * 없음, path+query만 — cancelMeetingReservation.ts와 동일 패턴). scope는 선택 쿼리로 미입력 시
 * 서버가 SINGLE(기본값)로 처리한다. 성공 시 `204 No Content`.
 */
export async function cancelSchedule(scheduleId: number, scope?: ScheduleScope): Promise<void> {
  await apiClient.patch(`/api/schedules/${scheduleId}/cancellation`, undefined, { params: { scope } })
}
