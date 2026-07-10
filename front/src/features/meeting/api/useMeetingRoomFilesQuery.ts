import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getMeetingRoomFiles } from './getMeetingRoomFiles'

/**
 * 회의실 첨부파일 목록 조회 훅(ROADMAP T2.2, F808).
 * meetingRoomId 미확정 시 조회하지 않고 대기한다(roomDetail/roomReservationsCalendar와 동일 이유).
 */
export function useMeetingRoomFilesQuery(meetingRoomId: number | undefined) {
  return useQuery({
    queryKey: meetingKeys.roomFiles(meetingRoomId),
    queryFn: () => getMeetingRoomFiles(meetingRoomId as number),
    enabled: meetingRoomId != null,
  })
}
