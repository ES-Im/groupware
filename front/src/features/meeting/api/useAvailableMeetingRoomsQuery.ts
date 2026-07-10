import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { AvailableMeetingRoomsSearchParams } from '../model/meeting'
import { getAvailableMeetingRooms } from './getAvailableMeetingRooms'

/**
 * 예약 가능 회의실 검색 훅(ROADMAP T3.1, F802).
 *
 * date/startAt/endAt/capacity 4개 필수 파라미터가 전부 확정되기 전에는 enabled:false로
 * 훅 호출을 지연한다(검색 조건 미확정 상태에서 요청이 나가는 것을 막는 가드 — board
 * useBoardListQuery·meeting useMeetingRoomDetailQuery와 동일 패턴). queryFn은 enabled 가드로
 * 인해 4개 필수값이 전부 채워진 경우에만 실행되므로 AvailableMeetingRoomsSearchParams로 단언한다.
 *
 * placeholderData: keepPreviousData로 검색 조건 변경 시 이전 검색 결과를 유지해 화면이
 * 매번 "불러오는 중..."으로 전면 교체되며 깜빡이는 것을 막는다(board 목록 훅과 동일 패턴).
 */
export function useAvailableMeetingRoomsQuery(params?: {
  date?: string
  startAt?: string
  endAt?: string
  capacity?: number
  page?: number
  size?: number
}) {
  const hasRequiredParams = Boolean(params?.date) && Boolean(params?.startAt) && Boolean(params?.endAt) && params?.capacity != null

  return useQuery({
    queryKey: meetingKeys.availableRooms(params),
    queryFn: () => getAvailableMeetingRooms(params as AvailableMeetingRoomsSearchParams),
    enabled: hasRequiredParams,
    placeholderData: keepPreviousData,
  })
}
