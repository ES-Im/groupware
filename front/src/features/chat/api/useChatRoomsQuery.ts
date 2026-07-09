import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { getChatRooms } from './getChatRooms'

/**
 * 내 채팅방 목록 조회 훅(`CHAT_ROOM_LIST`, ROADMAP(CHAT) T1.1, F901).
 *
 * params(keyword/isBookmark)는 queryKey에 그대로 포함되어 값이 바뀔 때마다 재요청된다.
 * roomId 의존이 없는 목록 조회라 이후 추가될 detail/messages 훅과 달리 기본적으로 enabled
 * 가드가 필요 없다.
 *
 * placeholderData: keepPreviousData로 검색어·즐겨찾기 필터 변경 시 새 응답이 도착하기 전까지
 * 이전 목록을 유지해 패널이 매번 "불러오는 중..."으로 전면 교체되며 깜빡이는 것을 막는다
 * (department 도메인 useDepartmentsQuery와 동일 패턴).
 */
export function useChatRoomsQuery(params?: { keyword?: string; isBookmark?: boolean }) {
  return useQuery({
    queryKey: chatKeys.rooms(params),
    queryFn: () => getChatRooms(params),
    placeholderData: keepPreviousData,
  })
}
