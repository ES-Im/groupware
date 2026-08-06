import { apiClient } from '@/shared/api/client'
import type { ManualScheduleUpdatePayload, ScheduleScope } from '../lib/scheduleTypes'

export async function updateManualSchedule(
  scheduleId: number,
  payload: ManualScheduleUpdatePayload,
  scope?: ScheduleScope,
): Promise<void> {
  await apiClient.patch(`/api/schedules/${scheduleId}`, payload, { params: { scope } })
}
