import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { updateMeetingRoom, type UpdateMeetingRoomPayload } from './updateMeetingRoom'

/** useMeetingRoomUpdateMutation 호출 변수. */
interface MeetingRoomUpdateVariables {
  meetingRoomId: number
  payload: UpdateMeetingRoomPayload
}

/**
 * 회의실 정보 수정 mutation 훅(`MEETING_ROOM_UPDATE`, ROADMAP(MEETING-ROOMS) T7.1, F813).
 * 성공(204) 시 회의실 상세(`meetingKeys.roomDetail`)·첨부파일 목록(`meetingKeys.roomFiles`)·
 * 회의실 관리 목록(`roomManagement`, F811)을 함께 invalidate한다. name/capacity는
 * `MeetingRoomManagementItem`에 노출되는 필드라 목록도 갱신해야 하며(useMeetingRoomActivate/
 * DeactivateMutation이 isAvailable 변경 시 roomManagement를 함께 무효화하는 것과 동일 이유),
 * 상세와 파일 목록도 T7.2 상세 화면이 한 화면에서 같이 보여주므로 함께 갱신한다. 실패 시 에러는
 * 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
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
