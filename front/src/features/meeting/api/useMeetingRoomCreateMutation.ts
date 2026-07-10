import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { createMeetingRoom } from './createMeetingRoom'

/**
 * 회의실 등록 mutation 훅(`MEETING_ROOM_CREATE`, ROADMAP(MEETING-ROOMS) T6.2, F812).
 * 성공(201) 시 회의실 관리 목록(F811, T6.1)만 갱신 대상이므로 meetingKeys.all 전체가 아니라
 * `[...meetingKeys.all, 'roomManagement']` 2단계 접두사로 invalidate한다(boardKeys.all+'list',
 * attendanceKeys.all+'dept'와 동일 컨벤션) — meetingKeys.roomManagement()를 인자 없이 그대로
 * 호출하면 3번째 원소가 `undefined`로 고정되어, page/size 등 실제 파라미터가 채워진 캐시 키와
 * partial match되지 않는다. 이름 중복 등 서버 판정 실패는 그대로 던져 호출부(T6.3-b)가
 * handleApiError로 위임하도록 둔다.
 */
export function useMeetingRoomCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeetingRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...meetingKeys.all, 'roomManagement'] })
    },
  })
}
