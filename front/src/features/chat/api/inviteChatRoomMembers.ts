import { apiClient } from '@/shared/api/client'

/** 채팅방 멤버 초대 요청 body(`CHAT_ROOM_INVITE`, request-fields.adoc 실측: memberIds 필수·빈 배열 불가). */
export interface InviteChatRoomMembersPayload {
  memberIds: number[]
}

/**
 * 채팅방 멤버 초대(`CHAT_ROOM_INVITE`, api-endpoint.md 기능ID `CHAT_ROOM_INVITE` →
 * `PATCH /api/chat/rooms/{roomId}/invite`, minRole EMPLOYEE(채팅방 멤버)). body는
 * `CHAT_ROOM_CREATE`(createChatRoom.ts)와 우연히 같은 모양(`{ memberIds }`)이나, 서버가
 * 기능ID별로 별도 문서화한 요청이라(request-fields.adoc 실측: `memberIds` Array, 필수·빈 배열
 * 불가) 타입/함수를 공유하지 않고 독립 선언한다. 성공 시 `204 No Content`(응답 본문 없음) —
 * 호출부(useInviteChatRoomMembersMutation)가 chatKeys.detail(roomId)를 invalidate한다.
 */
export async function inviteChatRoomMembers(
  roomId: number,
  payload: InviteChatRoomMembersPayload,
): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/invite`, payload)
}
