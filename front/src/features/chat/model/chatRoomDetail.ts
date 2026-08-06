export interface ChatRoomDetail {
  roomId: number
  roomName: string
  isGroup: boolean
  lastReadMessageId: number | null
  members: ChatRoomMember[]
}

export interface ChatRoomMember {
  memberId: number
  deptName: string | null
  memberName: string
  profileImageUrl: string | null
}
