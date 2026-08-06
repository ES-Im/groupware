export interface ChatMessage {
  id: number
  senderId: number
  clientMessageId: string
  senderName: string
  content: string
  sentAt: string
  profileImageUrl: string | null
}

export interface ChatMessagesPage {
  messages: ChatMessage[]
  nextCursor: number | null
  hasNext: boolean
}
