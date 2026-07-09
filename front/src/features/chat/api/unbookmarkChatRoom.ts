import { apiClient } from '@/shared/api/client'

/**
 * 채팅방 즐겨찾기 해제(`CHAT_ROOM_UNBOOKMARK`, api-endpoint.md 기능ID `CHAT_ROOM_UNBOOKMARK` →
 * `PATCH /api/chat/rooms/{roomId}/unbookmark`, minRole EMPLOYEE(채팅방 멤버)).
 * path roomId만 사용하고 요청 본문은 없다(path-parameters.adoc 실측). 성공 시 `204 No Content`
 * (응답 본문 없음) — 호출부(useToggleBookmarkMutation)가 chatKeys.all을 invalidate한다.
 */
export async function unbookmarkChatRoom(roomId: number): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/unbookmark`)
}
