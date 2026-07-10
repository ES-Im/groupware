import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { replaceMeetingParticipants } from './replaceMeetingParticipants'

/** useReplaceMeetingParticipantsMutation 호출 변수. */
interface ReplaceMeetingParticipantsVariables {
  meetingId: number
  participantIds: number[]
}

/**
 * 회의 참여자 전체 교체 mutation 훅(`MEETING_PARTICIPANTS_REPLACE`, ROADMAP(MEETING-ROOMS) T4.2, F805).
 *
 * 참여자 수 변경은 상세(F801)의 참여자 목록·캘린더(F800/F809)의 참여자 수 표시에 반영되므로
 * useCreateMeetingReservationMutation과 동일하게 meetingKeys.all 전체를 invalidate한다. 실패 시
 * 에러는 그대로 던져 호출부(T4.3-c)가 handleApiError로 위임하도록 둔다.
 */
export function useReplaceMeetingParticipantsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ meetingId, participantIds }: ReplaceMeetingParticipantsVariables) =>
      replaceMeetingParticipants(meetingId, participantIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}
