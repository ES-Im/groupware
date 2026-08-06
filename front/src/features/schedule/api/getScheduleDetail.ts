import { apiClient } from '@/shared/api/client'
import type { ScheduleDetailResponse } from '../lib/scheduleTypes'

export async function getScheduleDetail(scheduleId: number): Promise<ScheduleDetailResponse> {
  const { data } = await apiClient.get<ScheduleDetailResponse>(`/api/schedules/${scheduleId}`)
  return data
}
