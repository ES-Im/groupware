import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getAvailableMeetingRooms } from './getAvailableMeetingRooms'

/**
 * 예약 가능 회의실 검색 훅(ROADMAP T3.1, F802).
 *
 * date/startAt/endAt/capacity는 모두 선택값이라(입력한 조건만 필터로 적용) 파라미터만으로는
 * "검색을 실행할 시점"을 판정할 수 없다. 대신 검색 실행 여부를 상위(MeetingRoomSearchAndSelect)가
 * `options.enabled`로 명시 주입한다 — 검색 버튼을 누르기 전(초기 진입)에는 enabled:false로 요청을
 * 지연하고, 한 번이라도 검색하면 이후에는 조건이 비어 있어도(전체 조회) 조회한다.
 *
 * placeholderData: keepPreviousData로 검색 조건 변경 시 이전 검색 결과를 유지해 화면이
 * 매번 "불러오는 중..."으로 전면 교체되며 깜빡이는 것을 막는다(board 목록 훅과 동일 패턴).
 */
export function useAvailableMeetingRoomsQuery(
  params?: {
    date?: string
    startAt?: string
    endAt?: string
    capacity?: number
    page?: number
    size?: number
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: meetingKeys.availableRooms(params),
    queryFn: () => getAvailableMeetingRooms(params ?? {}),
    enabled: options?.enabled ?? false,
    placeholderData: keepPreviousData,
  })
}
