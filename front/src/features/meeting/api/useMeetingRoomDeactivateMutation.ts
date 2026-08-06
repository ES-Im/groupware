import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { deactivateMeetingRoom } from './toggleMeetingRoomActive'

export function useMeetingRoomDeactivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (meetingRoomId: number) => deactivateMeetingRoom(meetingRoomId),
    onSuccess: async (_data, meetingRoomId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...meetingKeys.all, 'roomManagement'] }),
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomDetail(meetingRoomId) }),
      ])
    },
  })
}
