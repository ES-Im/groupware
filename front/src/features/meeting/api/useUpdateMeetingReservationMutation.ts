import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { updateMeetingReservationInfo, type MeetingReservationUpdatePayload } from './updateMeetingReservationInfo'

/** useUpdateMeetingReservationMutation 호출 변수. */
interface UpdateMeetingReservationVariables {
  meetingId: number
  payload: MeetingReservationUpdatePayload
}

/**
 * 회의 예약 수정 mutation 훅(`MEETING_RESERVATION_UPDATE`, ROADMAP(MEETING-ROOMS) T4.2, F804).
 *
 * 회의실 변경(`meetingRoomId`)이 포함될 수 있어 수정 전/후 어느 회의실 예약 캘린더(F809)가
 * 영향받는지 호출 시점에 알 수 없다 — useCreateMeetingReservationMutation과 동일한 이유로
 * meetingKeys.all 전체를 invalidate해 상세(F801)·내 예약 캘린더(F800)·회의실 예약 캘린더(F809)·
 * 예약 관리 목록(F810)을 한 번에 갱신한다. 실패 시 에러는 그대로 던져 호출부(T4.3-b)가
 * handleApiError로 위임하도록 둔다.
 */
export function useUpdateMeetingReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ meetingId, payload }: UpdateMeetingReservationVariables) =>
      updateMeetingReservationInfo(meetingId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
