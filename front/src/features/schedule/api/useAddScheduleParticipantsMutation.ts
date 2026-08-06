import { useMutation } from '@tanstack/react-query'
import { addScheduleParticipants } from './addScheduleParticipants'
import type { ScheduleScope } from '../lib/scheduleTypes'

interface AddScheduleParticipantsVariables {
  scheduleId: number
  participantIds: number[]
  scope?: ScheduleScope
}

export function useAddScheduleParticipantsMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, participantIds, scope }: AddScheduleParticipantsVariables) =>
      addScheduleParticipants(scheduleId, participantIds, scope),
  })
}
