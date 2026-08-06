import { apiClient } from '@/shared/api/client'
import type {
  ManualScheduleCreatePayload,
  ManualScheduleCreateResponse,
} from '../lib/scheduleTypes'

export async function createManualSchedule(
  payload: ManualScheduleCreatePayload,
): Promise<ManualScheduleCreateResponse> {
  const { data } = await apiClient.post<ManualScheduleCreateResponse>('/api/schedules', payload)
  return data
}
