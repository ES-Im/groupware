import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getMeetingRoomDetail } from './getMeetingRoomDetail'

export function useMeetingRoomDetailQuery(meetingRoomId: number | undefined) {
  return useQuery({
    queryKey: meetingKeys.roomDetail(meetingRoomId),
    queryFn: () => getMeetingRoomDetail(meetingRoomId as number),
    enabled: meetingRoomId != null,
  })
}
