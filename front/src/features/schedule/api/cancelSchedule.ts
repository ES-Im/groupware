import { apiClient } from '@/shared/api/client'
import type { ScheduleScope } from '../lib/scheduleTypes'

export async function cancelSchedule(scheduleId: number, scope?: ScheduleScope): Promise<void> {
  await apiClient.patch(`/api/schedules/${scheduleId}/cancellation`, undefined, { params: { scope } })
}
