import { useQuery } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { getChatRoomDetail } from './getChatRoomDetail'

/**
 * 채팅방 상세 조회 훅(`CHAT_ROOM_DETAIL`, ROADMAP(CHAT) T2.1, F902).
 *
 * roomId가 아직 확정되지 않은 상태(라우트 파라미터 파싱 전·유효성 실패)에는 enabled:false로
 * 훅 호출을 지연해 undefined인 채로 요청이 나가는 것을 막는다(approval useDraftDetailQuery
 * 동형 가드). queryFn은 enabled 가드로 roomId가 확정된 경우에만 실행되므로 number로 단언한다.
 * roomId가 바뀌면 queryKey(chatKeys.detail)가 달라져 자동 재조회된다.
 *
 * 403/404 처리는 소비 컴포넌트(ChatRoomDetailPage)가 apiError 매핑으로 담당한다.
 */
export function useChatRoomDetailQuery(roomId: number | undefined) {
  return useQuery({
    queryKey: chatKeys.detail(roomId),
    queryFn: () => getChatRoomDetail(roomId as number),
    enabled: roomId != null,
  })
}
