import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { updateMeetingReservationInfo, type MeetingReservationUpdatePayload } from './updateMeetingReservationInfo'

interface UpdateMeetingReservationVariables {
  meetingId: number
  payload: MeetingReservationUpdatePayload
}

export function useUpdateMeetingReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ meetingId, payload }: UpdateMeetingReservationVariables) =>
      updateMeetingReservationInfo(meetingId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
