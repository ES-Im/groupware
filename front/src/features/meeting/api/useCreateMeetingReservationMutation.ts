import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { createMeetingReservation } from './createMeetingReservation'

/**
 * 회의 예약 생성 mutation 훅(`MEETING_RESERVATION_CREATE`, ROADMAP(MEETING-ROOMS) T3.2, F803).
 * 성공한 예약이 내 예약 캘린더(F800)·회의실 예약 캘린더(F809)·예약 관리 목록(F810) 등
 * meetingKeys 하위 어느 캐시에 반영될지 개별적으로 알 수 없으므로 meetingKeys.all로 전체를
 * 한 번에 invalidate한다(useBoardRegisterMutation과 동일 이유). 실패 시 에러는 그대로 던져
 * 호출부(T3.3-b)가 submitWithErrorMapping으로 위임하도록 둔다.
 */
export function useCreateMeetingReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeetingReservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
