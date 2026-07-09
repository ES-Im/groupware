import { apiClient } from '@/shared/api/client'

/**
 * 채팅방 나가기(`CHAT_ROOM_LEAVE`, api-endpoint.md 기능ID `CHAT_ROOM_LEAVE` →
 * `PATCH /api/chat/rooms/{roomId}/leave`, minRole EMPLOYEE(채팅방 멤버)).
 * path roomId만 사용하고 요청 본문은 없다(request-body.adoc 실측: 빈 본문). 성공 시
 * `204 No Content`(응답 본문 없음) — 호출부(useLeaveChatRoomMutation)가 chatKeys.all을
 * invalidate하고, 다이얼로그(LeaveChatRoomDialog)가 오버레이 목록 패널로 되돌아간다.
 */
export async function leaveChatRoom(roomId: number): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/leave`)
}
