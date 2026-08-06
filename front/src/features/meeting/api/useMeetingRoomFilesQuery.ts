import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getMeetingRoomFiles } from './getMeetingRoomFiles'

export function useMeetingRoomFilesQuery(meetingRoomId: number | undefined) {
  return useQuery({
    queryKey: meetingKeys.roomFiles(meetingRoomId),
    queryFn: () => getMeetingRoomFiles(meetingRoomId as number),
    enabled: meetingRoomId != null,
  })
}
