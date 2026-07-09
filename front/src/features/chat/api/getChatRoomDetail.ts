import { apiClient } from '@/shared/api/client'
import type { ChatRoomDetail } from '../model/chatRoomDetail'

/**
 * 채팅방 상세 조회(`CHAT_ROOM_DETAIL`, api-endpoint.md 기능ID `CHAT_ROOM_DETAIL` →
 * `GET /api/chat/rooms/{roomId}`, minRole 채팅방 멤버).
 *
 * 비멤버가 호출하면 서버가 403 또는 `CHAT_*` 도메인 에러(404 계열)를 반환한다 — 처리는
 * 에러코드에 의존하지 않고 apiError 매핑(isForbidden/isNotFound)으로 소비 화면이 위임한다
 * (approval getDraftDetail과 동일 패턴, reissue 금지).
 * //todo : back ApplicationErrorCode 실측상 비멤버 접근은 NotAllowedChatMemberException →
 * code=`CHAT_003`(httpStatus 403)이지 `ROLE_003`이 아니다. 그런데 shared/lib/apiError.ts의
 * isForbidden은 `error.code === 'ROLE_003'`로 하드코딩돼 있어 CHAT_003을 forbidden으로 인식하지
 * 못한다 — 위 주석의 "apiError 매핑(isForbidden)으로 위임"이 실제로는 동작하지 않고 소비 화면
 * (ChatRoomDetailPage)의 isForbidden 분기가 죽은 코드가 된다(대신 일반 실패 분기로 폴백).
 * isForbidden을 httpStatus===403 기반으로 바꾸거나 CHAT_003을 포함하도록 재검토 필요.
 */
export async function getChatRoomDetail(roomId: number): Promise<ChatRoomDetail> {
  const { data } = await apiClient.get<ChatRoomDetail>(`/api/chat/rooms/${roomId}`)
  return data
}
