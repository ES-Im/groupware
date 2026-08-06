import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { createMeetingReservation } from './createMeetingReservation'

export function useCreateMeetingReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeetingReservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
