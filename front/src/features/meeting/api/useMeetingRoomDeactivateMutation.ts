import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { deactivateMeetingRoom } from './toggleMeetingRoomActive'

/**
 * 회의실 비활성화 mutation 훅(`MEETING_ROOM_DEACTIVATE`, ROADMAP(MEETING-ROOMS) T6.2, F814).
 * M7 T7.2가 회의실 관리 상세 화면에서 그대로 import해 재사용할 예정이므로 페이지 로컬 함수로
 * 두지 않고 독립 export한다. 성공(204) 시 `[...meetingKeys.all, 'roomManagement']` 2단계
 * 접두사로 회의실 관리 목록(F811)을 invalidate하고, 동시에 mutate 시 받은 meetingRoomId로
 * `meetingKeys.roomDetail(meetingRoomId)`도 invalidate한다(useMeetingRoomActivateMutation과
 * 동일 이유 — M7 상세 화면 재사용 시 상세의 활성 상태가 stale해지는 것을 방지). 실패 시 에러는
 * 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
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
