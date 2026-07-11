import { apiClient } from '@/shared/api/client'
import type { ScheduleDetailResponse } from '../lib/scheduleTypes'

/**
 * 일정 상세 조회(`SCHEDULE_DETAIL`, api-endpoint.md 기능ID `SCHEDULE_DETAIL` →
 * `GET /api/schedules/{scheduleId}`). 참여자 목록·`isEditable` 등 상세 전용 필드를 포함해 반환한다.
 */
export async function getScheduleDetail(scheduleId: number): Promise<ScheduleDetailResponse> {
  const { data } = await apiClient.get<ScheduleDetailResponse>(`/api/schedules/${scheduleId}`)
  return data
}
