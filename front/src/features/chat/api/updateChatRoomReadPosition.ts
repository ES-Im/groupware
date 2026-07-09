import { apiClient } from '@/shared/api/client'

/**
 * 채팅방 읽음 위치 갱신(`CHAT_ROOM_READ_POSITION_UPDATE`, api-endpoint.md 기능ID
 * `CHAT_ROOM_READ_POSITION_UPDATE` → `PATCH /api/chat/rooms/{roomId}/read-position`,
 * minRole EMPLOYEE(채팅방 멤버)). body는 `{ lastReadMessageId }` 하나뿐이다
 * (`back/build/generated-snippets/CHAT_ROOM_READ_POSITION_UPDATE/request-fields.adoc` 실측:
 * Number, 필수). 성공 시 `204 No Content`(응답 본문 없음) — 호출부
 * (useUpdateReadPositionMutation)가 채팅방 목록 쿼리를 invalidate한다.
 */
export async function updateChatRoomReadPosition(
  roomId: number,
  lastReadMessageId: number,
): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/read-position`, { lastReadMessageId })
}
