import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { activateMeetingRoom } from './toggleMeetingRoomActive'

export function useMeetingRoomActivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (meetingRoomId: number) => activateMeetingRoom(meetingRoomId),
    onSuccess: async (_data, meetingRoomId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...meetingKeys.all, 'roomManagement'] }),
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomDetail(meetingRoomId) }),
      ])
    },
  })
}
