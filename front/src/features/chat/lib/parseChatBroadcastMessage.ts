import type { ChatMessage } from '../model/chatMessage'

export function parseChatBroadcastMessage(body: string): ChatMessage | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const envelope = parsed as Record<string, unknown>
  if (envelope.eventType !== 'MESSAGE_CREATED') {
    return null
  }
  if (typeof envelope.data !== 'object' || envelope.data === null) {
    return null
  }

  const candidate = envelope.data as Record<string, unknown>
  if (
    typeof candidate.chatId !== 'number' ||
    typeof candidate.senderId !== 'number' ||
    typeof candidate.clientMessageId !== 'string' ||
    typeof candidate.senderName !== 'string' ||
    typeof candidate.content !== 'string' ||
    typeof candidate.sentAt !== 'string'
  ) {
    return null
  }

  return {
    id: candidate.chatId,
    senderId: candidate.senderId,
    clientMessageId: candidate.clientMessageId,
    senderName: candidate.senderName,
    content: candidate.content,
    sentAt: candidate.sentAt,
    profileImageUrl:
      typeof candidate.profileImageUrl === 'string' ? candidate.profileImageUrl : null,
  }
}
