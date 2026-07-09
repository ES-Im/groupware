import { apiClient } from '@/shared/api/client'

/**
 * 채팅방 표시명 수정(`CHAT_ROOM_NAME_UPDATE`, api-endpoint.md 기능ID `CHAT_ROOM_NAME_UPDATE` →
 * `PATCH /api/chat/rooms/{roomId}/name`, minRole EMPLOYEE(채팅방 멤버)). body는 `{ name }`
 * 하나뿐이다(`back/build/generated-snippets/CHAT_ROOM_NAME_UPDATE/request-fields.adoc` 실측:
 * String, 필수·공백 불가·20자 이하).
 *
 * 이 표시명은 멤버별 커스텀 표시명이다(도메인모델 규칙, T1.1/T2.1에서 이미 다룬 내용 — 여기서
 * 재서술하지 않는다). 성공 시 `204 No Content`(응답 본문 없음) — 호출부
 * (useUpdateChatRoomNameMutation)가 chatKeys.all을 invalidate한다.
 */
export async function updateChatRoomName(roomId: number, name: string): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/name`, { name })
}
