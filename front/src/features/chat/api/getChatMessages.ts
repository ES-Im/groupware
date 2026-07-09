import { apiClient } from '@/shared/api/client'
import type { ChatMessagesPage } from '../model/chatMessage'

/**
 * 채팅 메시지 목록 cursor 페이징 조회(`CHAT_MESSAGES`, api-endpoint.md 기능ID `CHAT_MESSAGES` →
 * `GET /api/chat/rooms/{roomId}/messages`, minRole 채팅방 멤버).
 *
 * cursor/size 쿼리 파라미터는 모두 선택값이다(ChatApiDocsTest.java queryParameters 실측:
 * cursor="이전 페이지 기준 메시지 식별 번호", size="조회할 메시지 수, 기본값 50"). 값이 없는
 * 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다(getChatRooms와 동일 패턴).
 *
 * 응답은 Spring Page가 아닌 `{ messages[], nextCursor, hasNext }` 커스텀 cursor 페이징 구조다
 * (chatMessagesResponseFields 실측) — Page 매핑 없이 그대로 반환한다.
 */
export async function getChatMessages(
  roomId: number,
  params?: { cursor?: number; size?: number },
): Promise<ChatMessagesPage> {
  const query: Record<string, number> = {}
  if (params?.cursor != null) {
    query.cursor = params.cursor
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<ChatMessagesPage>(
    `/api/chat/rooms/${roomId}/messages`,
    { params: query },
  )
  return data
}
