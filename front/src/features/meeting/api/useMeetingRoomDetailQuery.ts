import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getMeetingRoomDetail } from './getMeetingRoomDetail'

/**
 * 회의실 상세 조회 훅(ROADMAP T2.1, F807).
 *
 * meetingRoomId가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전)에는 enabled:false로
 * 훅 호출을 지연한다(board useBoardDetailQuery와 동일 가드 패턴). queryFn은 enabled 가드로
 * 인해 meetingRoomId가 확정된 경우에만 실행되므로 number로 단언한다.
 */
export function useMeetingRoomDetailQuery(meetingRoomId: number | undefined) {
  return useQuery({
    queryKey: meetingKeys.roomDetail(meetingRoomId),
    queryFn: () => getMeetingRoomDetail(meetingRoomId as number),
    enabled: meetingRoomId != null,
  })
}
