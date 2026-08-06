import { apiClient } from '@/shared/api/client'
import type { ScheduleScope } from '../lib/scheduleTypes'

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
