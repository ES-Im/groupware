import { useMutation } from '@tanstack/react-query'
import { removeScheduleParticipants } from './removeScheduleParticipants'
import type { ScheduleScope } from '../lib/scheduleTypes'

/** useRemoveScheduleParticipantsMutation 호출 변수. */
interface RemoveScheduleParticipantsVariables {
  scheduleId: number
  participantIds: number[]
  scope?: ScheduleScope
}

/**
 * 일정 참여자 제외 mutation 훅(`SCHEDULE_PARTICIPANTS_REMOVE`, ROADMAP(SCHEDULE) T5.1, F006).
 * invalidate는 여기서 처리하지 않는다 — 소비처(T5.3)가 성공 후 scheduleKeys.detail(scheduleId)를
 * 직접 invalidate한다(useUpdateManualScheduleMutation 선례와 동일하게 훅은 순수 mutation만 제공).
 */
export function useRemoveScheduleParticipantsMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, participantIds, scope }: RemoveScheduleParticipantsVariables) =>
      removeScheduleParticipants(scheduleId, participantIds, scope),
  })
}
