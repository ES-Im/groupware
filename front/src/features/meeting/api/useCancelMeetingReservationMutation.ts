import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { cancelMeetingReservation } from './cancelMeetingReservation'

export function useCancelMeetingReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (meetingId: number) => cancelMeetingReservation(meetingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
