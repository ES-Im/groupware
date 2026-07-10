import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { MeetingRoomManagementSearchParams } from '../model/meeting'
import { getMeetingRoomManagementList } from './getMeetingRoomManagementList'

/**
 * 회의실 관리 목록 조회 훅(ROADMAP T6.1, F811).
 *
 * available/bookedInFuture/page/size 전부 선택값이라 필수 파라미터 확정을 기다리는 enabled
 * 가드가 필요 없다(meeting useManagementReservationsQuery와 동일하게 항상 활성 상태로 조회한다).
 * placeholderData: keepPreviousData로 필터·페이지 변경 시 새 응답이 도착하기 전까지 이전
 * 목록을 유지해 화면이 매번 "불러오는 중..."으로 전면 교체되며 깜빡이는 것을 막는다.
 */
export function useMeetingRoomManagementListQuery(params?: MeetingRoomManagementSearchParams) {
  return useQuery({
    queryKey: meetingKeys.roomManagement(params),
    queryFn: () => getMeetingRoomManagementList(params),
    placeholderData: keepPreviousData,
  })
}
