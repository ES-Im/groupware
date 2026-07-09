import { apiClient } from '@/shared/api/client'

/** 채팅방 생성 요청 body(`CHAT_ROOM_CREATE`, request-fields 실측: memberIds 필수·빈 배열 불가). */
export interface CreateChatRoomPayload {
  memberIds: number[]
}

/** 채팅방 생성 응답(response-fields 실측: 생성된 채팅방 식별 번호). */
export interface CreateChatRoomResult {
  roomId: number
}

/**
 * 채팅방 생성(`CHAT_ROOM_CREATE`, api-endpoint.md 기능ID `CHAT_ROOM_CREATE` →
 * `POST /api/chat/rooms`, minRole EMPLOYEE). 성공 응답은 `200`(**201 아님** —
 * `ChatApiDocsTest.createChatRoom()`이 `status().isOk()`로 문서화, generated-snippets 미생성이라
 * 테스트 원본 실측) + `{ roomId }`. 서버가 방 생성자(호출자)를 멤버에 자동 포함하므로
 * (`ChatRoom.createRoom()`), body의 memberIds에는 본인을 포함하지 않는다(CreateChatRoomDialog가
 * disabledEmpIds로 이미 배제).
 */
export async function createChatRoom(payload: CreateChatRoomPayload): Promise<CreateChatRoomResult> {
  const { data } = await apiClient.post<CreateChatRoomResult>('/api/chat/rooms', payload)
  return data
}
