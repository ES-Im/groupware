import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { deleteMeetingRoomFile } from './deleteMeetingRoomFile'

/** useMeetingRoomFileDeleteMutation 호출 변수. */
interface MeetingRoomFileDeleteVariables {
  meetingRoomId: number
  fileId: number
}

/**
 * 회의실 안내 이미지 삭제 mutation 훅(`MEETING_ROOM_FILE_DELETE`, ROADMAP(MEETING-ROOMS) T7.1, F816).
 * 성공(204) 시 회의실 상세(`meetingKeys.roomDetail`)와 첨부파일 목록(`meetingKeys.roomFiles`)을
 * 함께 invalidate한다. 실패 시 에러는 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
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
