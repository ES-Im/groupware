export interface ChatRoomListItem {
  chatRoomId: number
  roomName: string | null
  lastMessageContent: string | null
  lastMessagedAt: string | null
  unreadMessageCount: number | null
  isGroup: boolean
  isPastRoom: boolean
  isBookmarked: boolean
  joinedMemberCount: number
  participantNames: string[]
}
