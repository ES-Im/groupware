import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { createMeetingRoom } from './createMeetingRoom'

export function useMeetingRoomCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeetingRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...meetingKeys.all, 'roomManagement'] })
    },
  })
}
