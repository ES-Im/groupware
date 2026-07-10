import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getMeetingReservationDetail } from './getMeetingReservationDetail'

/**
 * 회의 예약 상세 조회 훅(ROADMAP(MEETING-ROOMS) T4.1, F801).
 *
 * meetingId가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전)에는 enabled:false로 훅 호출을
 * 지연한다(meeting useMeetingRoomDetailQuery·board useBoardDetailQuery와 동일 가드 패턴).
 * queryFn은 enabled 가드로 인해 meetingId가 확정된 경우에만 실행되므로 number로 단언한다.
 *
 * 404는 별도로 가로채지 않는다 — query.error를 소비부(T4.3-a)에서 normalizeApiError/isNotFound로
 * 판별하는 기존 handleApiError 경로에 그대로 위임한다.
 */
export function useMeetingReservationDetailQuery(meetingId: number | undefined) {
  return useQuery({
    queryKey: meetingKeys.reservationDetail(meetingId),
    queryFn: () => getMeetingReservationDetail(meetingId as number),
    enabled: meetingId != null,
  })
}
