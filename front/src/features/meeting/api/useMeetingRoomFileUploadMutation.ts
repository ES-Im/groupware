import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateMeetingRoomFileUpload } from '../lib/meetingRoomFileValidation'
import { meetingKeys } from '../model/meetingKeys'
import { uploadMeetingRoomFile } from './uploadMeetingRoomFile'

/** useMeetingRoomFileUploadMutation 호출 변수. */
interface MeetingRoomFileUploadVariables {
  meetingRoomId: number
  file: File
}

/**
 * 회의실 안내 이미지 업로드 mutation 훅(`MEETING_ROOM_FILE_UPLOAD`, ROADMAP(MEETING-ROOMS) T7.1, F815).
 *
 * `validateMeetingRoomFileUpload`(확장자·용량)를 먼저 통과해야 실제 PATCH가 나간다 — 위반 시
 * 네트워크 요청 자체가 발생하지 않고 `MeetingRoomFileValidationError`가 그대로 던져진다(호출부가
 * handleApiError류로 위임해 토스트 노출). 성공(204) 시 회의실 상세(`meetingKeys.roomDetail`)와
 * 첨부파일 목록(`meetingKeys.roomFiles`)을 함께 invalidate한다.
 */
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
