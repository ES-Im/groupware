import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { cancelMeetingReservation } from './cancelMeetingReservation'

/**
 * 회의 예약 취소 mutation 훅(`MEETING_RESERVATION_CANCEL`, ROADMAP(MEETING-ROOMS) T4.2, F806).
 *
 * 취소(`isCanceled`)는 상세(F801)·내 예약 캘린더(F800)·예약 관리 목록(F810)에 모두 반영되므로
 * useCreateMeetingReservationMutation과 동일하게 meetingKeys.all 전체를 invalidate한다. 실패 시
 * 에러는 그대로 던져 호출부(T4.3-c)가 handleApiError로 위임하도록 둔다.
 */
export function useCancelMeetingReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (meetingId: number) => cancelMeetingReservation(meetingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
