import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { deleteMeetingRoomFile } from './deleteMeetingRoomFile'

interface MeetingRoomFileDeleteVariables {
  meetingRoomId: number
  fileId: number
}

export function useMeetingRoomFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ meetingRoomId, fileId }: MeetingRoomFileDeleteVariables) =>
      deleteMeetingRoomFile(meetingRoomId, fileId),
    onSuccess: async (_data, { meetingRoomId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomDetail(meetingRoomId) }),
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomFiles(meetingRoomId) }),
      ])
    },
  })
}
