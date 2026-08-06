import { useMutation } from '@tanstack/react-query'
import { updateManualSchedule } from './updateManualSchedule'
import type { ManualScheduleUpdatePayload, ScheduleScope } from '../lib/scheduleTypes'

interface UpdateManualScheduleVariables {
  scheduleId: number
  payload: ManualScheduleUpdatePayload
  scope?: ScheduleScope
}

export function useUpdateManualScheduleMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, payload, scope }: UpdateManualScheduleVariables) =>
      updateManualSchedule(scheduleId, payload, scope),
  })
}
