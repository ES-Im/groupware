import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { updateMeetingRoom, type UpdateMeetingRoomPayload } from './updateMeetingRoom'

interface MeetingRoomUpdateVariables {
  meetingRoomId: number
  payload: UpdateMeetingRoomPayload
}

export function useMeetingRoomUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ meetingRoomId, payload }: MeetingRoomUpdateVariables) => updateMeetingRoom(meetingRoomId, payload),
    onSuccess: async (_data, { meetingRoomId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomDetail(meetingRoomId) }),
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomFiles(meetingRoomId) }),
        queryClient.invalidateQueries({ queryKey: [...meetingKeys.all, 'roomManagement'] }),
      ])
    },
  })
}
