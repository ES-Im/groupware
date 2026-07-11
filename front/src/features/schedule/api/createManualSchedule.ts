import { apiClient } from '@/shared/api/client'
import type {
  ManualScheduleCreatePayload,
  ManualScheduleCreateResponse,
} from '../lib/scheduleTypes'

/**
 * 수기 일정 등록(`MANUAL_SCHEDULE_CREATE`, api-endpoint.md 기능ID `MANUAL_SCHEDULE_CREATE` →
 * `POST /api/schedules`). 성공 시 `201 { sourceKey }`(response-fields.adoc 실측)를 그대로 반환한다.
 * 검증/서버 실패는 그대로 던져 호출부(T3.3)가 submitWithErrorMapping으로 위임하도록 둔다.
 */
export async function createManualSchedule(
  payload: ManualScheduleCreatePayload,
): Promise<ManualScheduleCreateResponse> {
  const { data } = await apiClient.post<ManualScheduleCreateResponse>('/api/schedules', payload)
  return data
}
