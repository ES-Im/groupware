import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateMeetingRoomFileUpload } from '../lib/meetingRoomFileValidation'
import { meetingKeys } from '../model/meetingKeys'
import { uploadMeetingRoomFile } from './uploadMeetingRoomFile'

interface MeetingRoomFileUploadVariables {
  meetingRoomId: number
  files: File[]
}

export function useMeetingRoomFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ meetingRoomId, files }: MeetingRoomFileUploadVariables) => {
      for (const file of files) {
        validateMeetingRoomFileUpload(file)
      }
      for (const file of files) {
        await uploadMeetingRoomFile(meetingRoomId, file)
      }
    },
    onSuccess: async (_data, { meetingRoomId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomDetail(meetingRoomId) }),
        queryClient.invalidateQueries({ queryKey: meetingKeys.roomFiles(meetingRoomId) }),
      ])
    },
  })
}
