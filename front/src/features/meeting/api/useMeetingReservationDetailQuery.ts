import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getMeetingReservationDetail } from './getMeetingReservationDetail'

export function useMeetingReservationDetailQuery(meetingId: number | undefined) {
  return useQuery({
    queryKey: meetingKeys.reservationDetail(meetingId),
    queryFn: () => getMeetingReservationDetail(meetingId as number),
    enabled: meetingId != null,
  })
}
