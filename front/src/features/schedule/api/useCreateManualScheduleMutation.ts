import { useMutation } from '@tanstack/react-query'
import { createManualSchedule } from './createManualSchedule'

export function useCreateManualScheduleMutation() {
  return useMutation({
    mutationFn: createManualSchedule,
  })
}
