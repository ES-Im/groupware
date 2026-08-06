import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateMeetingRoomFileUpload } from '../lib/meetingRoomFileValidation'
import { meetingKeys } from '../model/meetingKeys'
import { uploadMeetingRoomFile } from './uploadMeetingRoomFile'

interface MeetingRoomFileUploadVariables {
  meetingRoomId: number
  file: File
}

export function useMeetingRoomFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ meetingRoomId, file }: MeetingRoomFileUploadVariables) => {
      validateMeetingRoomFileUpload(file)
      await uploadMeetingRoomFile(meetingRoomId, file)
    },
    onSuccess: async (_data, { meetingRoomId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomDetail(meetingRoomId) }),
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomFiles(meetingRoomId) }),
      ])
    },
  })
}
