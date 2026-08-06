import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ScheduleScope } from '../lib/scheduleTypes'
import { scheduleKeys } from '../model/scheduleKeys'
import { cancelSchedule } from './cancelSchedule'

interface CancelScheduleVariables {
  scheduleId: number
  scope?: ScheduleScope
}

export function useCancelScheduleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scheduleId, scope }: CancelScheduleVariables) => cancelSchedule(scheduleId, scope),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(variables.scheduleId) })
      queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
    },
  })
}
