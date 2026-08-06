import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { replaceMeetingParticipants } from './replaceMeetingParticipants'

interface ReplaceMeetingParticipantsVariables {
  meetingId: number
  participantIds: number[]
}

export function useReplaceMeetingParticipantsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ meetingId, participantIds }: ReplaceMeetingParticipantsVariables) =>
      replaceMeetingParticipants(meetingId, participantIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
