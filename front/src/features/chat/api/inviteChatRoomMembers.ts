import { apiClient } from '@/shared/api/client'

export interface InviteChatRoomMembersPayload {
  memberIds: number[]
}

export async function inviteChatRoomMembers(
  roomId: number,
  payload: InviteChatRoomMembersPayload,
): Promise<void> {
  await apiClient.patch(`/api/chat/rooms/${roomId}/invite`, payload)
}
