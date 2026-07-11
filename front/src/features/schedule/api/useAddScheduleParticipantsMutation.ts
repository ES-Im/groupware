import { useMutation } from '@tanstack/react-query'
import { addScheduleParticipants } from './addScheduleParticipants'
import type { ScheduleScope } from '../lib/scheduleTypes'

/** useAddScheduleParticipantsMutation 호출 변수. */
interface AddScheduleParticipantsVariables {
  scheduleId: number
  participantIds: number[]
  scope?: ScheduleScope
}

/**
 * 일정 참여자 추가 mutation 훅(`SCHEDULE_PARTICIPANTS_ADD`, ROADMAP(SCHEDULE) T5.1, F005).
 * invalidate는 여기서 처리하지 않는다 — 소비처(T5.2)가 성공 후 scheduleKeys.detail(scheduleId)를
 * 직접 invalidate한다(useUpdateManualScheduleMutation 선례와 동일하게 훅은 순수 mutation만 제공).
 */
export function useAddScheduleParticipantsMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, participantIds, scope }: AddScheduleParticipantsVariables) =>
      addScheduleParticipants(scheduleId, participantIds, scope),
  })
}
