import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { activateMeetingRoom } from './toggleMeetingRoomActive'

/**
 * 회의실 활성화 mutation 훅(`MEETING_ROOM_ACTIVATE`, ROADMAP(MEETING-ROOMS) T6.2, F814).
 * M7 T7.2가 회의실 관리 상세 화면에서 그대로 import해 재사용할 예정이므로 페이지 로컬 함수로
 * 두지 않고 독립 export한다. 성공(204) 시 `[...meetingKeys.all, 'roomManagement']` 2단계
 * 접두사로 회의실 관리 목록(F811)을 invalidate하고(meetingKeys.roomManagement()를 인자 없이
 * 호출하면 파라미터가 채워진 실제 캐시 키와 partial match되지 않는다), 동시에 mutate 시 받은
 * meetingRoomId로 `meetingKeys.roomDetail(meetingRoomId)`도 invalidate한다 — M7이 이 훅을
 * 상세 화면에서 재사용할 때 목록만 갱신되고 상세의 활성 상태가 stale해지는 것을 막기 위함이다
 * (department의 활성/비활성 토글 선례가 detail 키도 함께 무효화하는 것과 동일 이유). 실패 시
 * 에러는 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
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
