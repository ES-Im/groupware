import { useMutation } from '@tanstack/react-query'
import { removeScheduleParticipants } from './removeScheduleParticipants'
import type { ScheduleScope } from '../lib/scheduleTypes'

interface RemoveScheduleParticipantsVariables {
  scheduleId: number
  participantIds: number[]
  scope?: ScheduleScope
}

export function useRemoveScheduleParticipantsMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, participantIds, scope }: RemoveScheduleParticipantsVariables) =>
      removeScheduleParticipants(scheduleId, participantIds, scope),
  })
}
