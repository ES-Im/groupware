export interface MessagesResponse {
  messageId: number
  title: string
  senderId: number
  senderDeptName: string | null
  senderName: string
  representativeReceiverId: number | null
  representativeReceiverDeptName: string | null
  representativeReceiverName: string | null
  receiverCount: number
  sentAt: string | null
  isRead: boolean | null
  trashedAt: string | null
  isSentByMe: boolean
  fileCount: number
}

export interface ReceiverInfo {
  receiverId: number
  receiverDeptName: string | null
  receiverName: string
  isRead: boolean
}

export interface MessageDetailResponse {
  messageId: number
  title: string
  content: string
  senderId: number
  senderDeptName: string | null
  senderName: string
  receivers: ReceiverInfo[]
  sentAt: string | null
  isSentByMe: boolean
  isTrashedByMe: boolean
  fileCount: number
}

export interface MessageCountResponse {
  receivedCount: number
  unreadReceivedCount: number
  sentCount: number
  draftCount: number
  trashCount: number
}

export interface FileListInfo {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

export type MailBox = 'received' | 'sent' | 'drafts' | 'trash'
